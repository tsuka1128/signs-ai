import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";

/**
 * 部署ごとのボイスチェック自由回答をAI要約するAPIエンドポイント
 * 
 * @route POST /api/ai/dept-summary
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

        // 4. キャッシュ確認：同部署 × 同月が既に生成されていれば即返却
        const { data: cachedSummary } = await supabase
            .from('dept_ai_summaries')
            .select('*')
            .eq('department_id', department_id)
            .eq('month', month)
            .maybeSingle();

        if (cachedSummary) {
            return NextResponse.json(cachedSummary);
        }

        // 5. survey_responses から今月・該当部署の free_comment / cross_dept_feedback を取得
        const { data: responses, error: responseErr } = await supabase
            .from('survey_responses')
            .select('free_comment, cross_dept_feedback')
            .eq('company_id', companyId)
            .eq('department_id', department_id)
            .eq('recorded_month', month);

        if (responseErr) throw responseErr;

        // コメントテキストをフィルタリングして結合
        const commentsList: string[] = [];
        (responses || []).forEach(r => {
            if (r.free_comment && r.free_comment.trim()) {
                commentsList.push(r.free_comment.trim());
            }
            if (r.cross_dept_feedback && r.cross_dept_feedback.trim()) {
                commentsList.push(r.cross_dept_feedback.trim());
            }
        });

        // 6. 匿名ガード：回答者数（survey_responses の行数）が3人未満の場合は400エラー
        const respondentCount = (responses || []).length;
        if (respondentCount < 3) {
            return NextResponse.json({ error: "INSUFFICIENT_RESPONSES" }, { status: 400 });
        }

        // 7. コメントテキストを結合してプロンプト生成
        const n = commentsList.length;
        const commentsText = commentsList.map((c, i) => `【コメント ${i + 1}】\n${c}`).join("\n\n");

        // システムプロンプト
        const systemPrompt = `あなたは組織サーベイの分析専門家です。
従業員の自由回答から、個人が特定されない形で組織の状態に関するインサイトを抽出してください。
出力はJSON形式のみで返してください（Markdownコードブロック不要）。`;

        // ユーザープロンプト
        const prompt = `以下は今月の従業員アンケートの自由回答です（匿名、${n}名分）。

【自由コメント】
${commentsText}

次のJSON形式で返してください：
{
  "topics": [
    { "title": "トピック名（10文字以内）", "sentiment": "positive|negative|neutral", "count": 出現数の目安 }
  ],
  "positive_summary": "ポジティブな声の要約（50文字程度）",
  "negative_summary": "課題・改善要望の要約（50文字程度）",
  "manager_hint": "マネージャーが今月注目すべき一文（40文字程度）"
}

注意：
- topics は3〜5件に絞ること
- 個人が特定できる表現は使わないこと
- コメントがない場合は該当項目を空文字にすること`;

        // 8. Claude API 呼び出し
        const sysSettings = await getSystemSettings();
        let aiResultRaw: string;

        try {
            aiResultRaw = await generateAIInsight(prompt, {
                systemPrompt,
                model: sysSettings['default_model'] || 'claude-3-7-sonnet-20250219',
                apiKey: sysSettings['anthropic_api_key'] || sysSettings['claude_api_key'],
                maxTokens: 512,
                temperature: 0.3,
                companyId,
                agentName: "CPO Elon",
                purpose: "dept_summary"
            });
        } catch (apiError: any) {
            console.error("[Claude API Error]:", apiError);
            return NextResponse.json({ error: "AI要約の生成に失敗しました（外部APIエラー）" }, { status: 500 });
        }

        // 9. レスポンスをパースしてDBにupsertキャッシュ保存
        let aiResult: any;
        try {
            const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
            aiResult = JSON.parse(cleanJson);
        } catch (jsonError) {
            console.error("[AI JSON Parse Error]:", jsonError, "Raw Data:", aiResultRaw);
            return NextResponse.json({ error: "AIの回答を解析できませんでした" }, { status: 500 });
        }

        const { data: upsertedData, error: upsertErr } = await supabase
            .from('dept_ai_summaries')
            .upsert({
                company_id: companyId,
                department_id: department_id,
                month: month,
                topics: aiResult.topics || [],
                positive_summary: aiResult.positive_summary || "",
                negative_summary: aiResult.negative_summary || "",
                manager_hint: aiResult.manager_hint || "",
                generated_at: new Date().toISOString()
            }, {
                onConflict: 'department_id,month'
            })
            .select()
            .single();

        if (upsertErr) {
            console.error("[Database Save Error]:", upsertErr);
            return NextResponse.json({ error: "要約のキャッシュ保存に失敗しました" }, { status: 500 });
        }

        // 10. 結果を返却
        return NextResponse.json(upsertedData);

    } catch (error: any) {
        console.error("[dept-summary API Route Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
