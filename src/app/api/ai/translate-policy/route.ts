import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. ユーザーの企業ID取得
        const { data: profile } = await supabase
            .from("users")
            .select("company_id")
            .eq("id", user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        // 3. リクエストボディ解析
        const { policyText } = await req.json();
        if (!policyText) {
            return NextResponse.json({ error: "Policy text is required" }, { status: 400 });
        }

        // 4. 部署一覧の取得
        const { data: depts } = await supabase
            .from('departments')
            .select('id, name')
            .eq('company_id', profile.company_id);

        if (!depts || depts.length === 0) {
            return NextResponse.json({ translations: {} });
        }

        // 5. Claude へのプロンプト構築
        const systemPrompt = `あなたは組織改善AI「Signs AI」の経営アドバイザーです。
全社的な「組織方針」を読み込み、各部署のメンバーにとって「自分事」として捉えられるような、具体的で温かみのある要約メッセージ（方針翻訳）を生成してください。

回答は以下の構造を持ったJSON形式のみで出力してください。
{
  "translations": {
    "部署ID": "その部署向けのメッセージ（80文字〜120文字程度。語尾は部署のトーンに合わせる必要はありませんが、誠実で前向きなものにしてください）"
  }
}`;

        const prompt = `組織方針:
${policyText}

対象部署一覧:
${JSON.stringify(depts.map(d => ({ id: d.id, name: d.name })))}

上記方針を、各部署のメンバーが明日から何を意識すべきか分かるように「翻訳」してください。
専門用語は避け、現場視点での言葉に変換してください。`;

        // 5.1 システム設定の取得
        const sysSettings = await getSystemSettings();

        const aiResultRaw = await generateAIInsight(prompt, {
            systemPrompt,
            temperature: sysSettings['temperature'] ?? 0.7,
            maxTokens: sysSettings['max_tokens'] ?? 2000,
            model: sysSettings['default_model'] ?? "claude-3-7-sonnet-20250219",
            apiKey: sysSettings['anthropic_api_key']
        });

        const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
        const aiResult = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, translations: aiResult.translations });

    } catch (error: any) {
        console.error("[Policy Translation API Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
