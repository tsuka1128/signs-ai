import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";

/**
 * 部署ごとのボイスチェック要約を元に、今月のAI提案アクションプランを自動生成するAPIエンドポイント
 * 
 * @route POST /api/ai/dept-action-proposals
 */
export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. 認証確認
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. ユーザーのプロフィール取得（ロール確認）
        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        // playerロールは権限なし (403)
        if (profile.role === "player") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const companyId = profile.company_id;
        if (!companyId) {
            return NextResponse.json({ error: "No company associated with this user" }, { status: 400 });
        }

        // リクエストボディのバリデーション
        const { department_id, month } = await req.json();
        if (!department_id || !month) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // セキュリティチェック：リクエストされた部署が同じ会社に属しているか
        const { data: dept, error: deptErr } = await supabase
            .from('departments')
            .select('company_id')
            .eq('id', department_id)
            .single();

        if (deptErr || !dept) {
            return NextResponse.json({ error: "DEPT_NOT_FOUND" }, { status: 400 });
        }

        if (dept.company_id !== companyId) {
            return NextResponse.json({ error: "Forbidden - Department belongs to another company" }, { status: 403 });
        }

        // ① ボイスチェック要約が存在するか確認
        const { data: summary } = await supabase
            .from('dept_ai_summaries')
            .select('positive_summary, negative_summary, manager_hint')
            .eq('department_id', department_id)
            .eq('month', month)
            .maybeSingle();

        if (!summary || (!summary.positive_summary && !summary.negative_summary)) {
            return NextResponse.json(
                { error: 'NO_SUMMARY_FOUND' },
                { status: 400 }
            );
        }

        // ② 既に今月のAI提案が存在する場合はスキップ（月1回まで）
        const { data: existing } = await supabase
            .from('dept_action_plans')
            .select('id')
            .eq('department_id', department_id)
            .eq('month', month)
            .eq('source', 'ai_proposed')
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json({ skipped: true, reason: 'ALREADY_GENERATED' });
        }

        // ③ Claude APIでアクション提案生成
        const sysSettings = await getSystemSettings();
        const prompt = `
以下のデータをもとに、このマネージャーが今月実行できる具体的なアクションを3〜5個提案してください。

【ポジティブなポイント】
${summary.positive_summary || 'なし'}

【改善が必要なポイント】
${summary.negative_summary || 'なし'}

【マネージャーへのヒント】
${summary.manager_hint || 'なし'}

【出力条件】
- 1アクションにつき title（20文字以内）と description（60文字以内）を作成
- 抽象論ではなく「今週〜今月中に実行できる」レベルで具体的に
- 必ずJSON配列のみを返す（説明文不要）
- 形式: [{"title":"...","description":"..."},...]
`;

        const systemPrompt = `あなたは組織開発のスペシャリストです。
提示された要約データをもとに、マネージャーが実行すべきアクションをJSON形式のみで出力してください。Markdownコードブロックなどは一切含めないでください。`;

        let ProposalsText: string;
        try {
            ProposalsText = await generateAIInsight(prompt, {
                systemPrompt,
                model: sysSettings['default_model'] || 'claude-sonnet-4-5',
                apiKey: sysSettings['anthropic_api_key'] || sysSettings['claude_api_key'],
                maxTokens: 1024,
                temperature: 0.3,
            });
        } catch (apiError: any) {
            console.error("[Claude API Error (Proposals)]:", apiError);
            return NextResponse.json({ error: "AI提案の生成に失敗しました（外部APIエラー）" }, { status: 500 });
        }

        let proposals: { title: string; description: string }[] = [];
        try {
            const cleanJson = ProposalsText.replace(/```json\n?|\n?```/g, "").trim();
            const match = cleanJson.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('JSON not found');
            proposals = JSON.parse(match[0]);
        } catch (jsonErr) {
            console.error("[AI Proposals JSON Parse Error]:", jsonErr, "Raw Data:", ProposalsText);
            return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 });
        }

        if (!proposals.length) {
            return NextResponse.json({ error: 'NO_PROPOSALS' }, { status: 500 });
        }

        // ④ DBに保存（source='ai_proposed', status='proposed'）
        // AI生成は manager_user_id: null でインサートするため service_role クライアントを使用する
        const supabaseService = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const rows = proposals.map((p) => ({
            company_id: companyId,
            department_id,
            manager_user_id: null,  // AI生成はnull
            month,
            title: p.title,
            description: p.description,
            source: 'ai_proposed',
            status: 'proposed',
        }));

        const { error: insertErr } = await supabaseService.from('dept_action_plans').insert(rows);
        if (insertErr) {
            console.error("[Database Save Error (Proposals)]:", insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: rows.length });
    } catch (error: any) {
        console.error("[dept-action-proposals API Route Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
