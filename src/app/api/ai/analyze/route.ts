import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateAIInsight } from "@/lib/claude";
import { NextResponse } from "next/server";
import { normalizeMonth, getLastNMonths } from "@/lib/utils/date";

export async function POST(req: Request) {
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
            .select("company_id, companies(*)")
            .eq("id", user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        const company = (profile as any).companies;
        const companyId = profile.company_id;

        // 3. 分析に必要なデータの取得
        const last13Months = getLastNMonths(13);
        const latestMonth = last13Months[12];
        const historicalMonths = {
            "1m": last13Months[11],
            "3m": last13Months[9],
            "6m": last13Months[6],
            "12m": last13Months[0]
        };

        const targetMonths = [latestMonth, ...Object.values(historicalMonths)];

        const [
            depts,
            kpiDefs,
            surveys,
            kpiRecs,
            semantic
        ] = await Promise.all([
            supabase.from('departments').select('*').eq('company_id', companyId),
            supabase.from('kpi_definitions').select('*').eq('company_id', companyId),
            supabase.from('survey_responses')
                .select('*, survey_answers(*)')
                .eq('company_id', companyId)
                .in('recorded_month', targetMonths),
            supabase.from('kpi_records')
                .select('*')
                .eq('company_id', companyId)
                .in('recorded_month', targetMonths),
            supabase.from('semantic_layers')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
        ]);

        // データが足りない場合のフォールバック
        const policy = semantic.data?.content || "組織方針がまだ設定されていません。";

        // 月ごとの簡易サマリーを作成してAIに渡す
        const summarizeMonth = (month: string) => {
            const monthSurveys = surveys.data?.filter(s => normalizeMonth(s.recorded_month) === normalizeMonth(month)) || [];
            const monthKpis = kpiRecs.data?.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(month)) || [];
            
            const avgPulse = monthSurveys.length > 0 
                ? monthSurveys.flatMap(s => s.survey_answers || []).reduce((acc, a) => acc + a.score, 0) / (monthSurveys.flatMap(s => s.survey_answers || []).length || 1)
                : 0;
            
            return {
                month,
                avg_pulse: avgPulse.toFixed(2),
                kpi_count: monthKpis.length,
                kpi_summary: monthKpis.map(r => {
                    const def = kpiDefs.data?.find(d => d.id === r.kpi_definition_id);
                    const polarity = def?.is_higher_better !== false ? "高いほど良い" : "低いほど良い";
                    return `${def?.name || 'KPI'}: ${r.value}${def?.unit || ''} (目標: ${r.target_value}${def?.unit || ''}, 評価基準: ${polarity})`;
                })
            };
        };

        const historicalContext = {
            current: summarizeMonth(latestMonth),
            "1m": summarizeMonth(historicalMonths["1m"]),
            "3m": summarizeMonth(historicalMonths["3m"]),
            "6m": summarizeMonth(historicalMonths["6m"]),
            "12m": summarizeMonth(historicalMonths["12m"]),
        };

        // 4. Claude へのプロンプト構築
        const systemPrompt = `あなたは組織改善AI「Signs AI」の経営コンサルタントです。
組織の状態（アンケートスコア）と業績（KPI）を、会社が定めた「組織方針」に照らし合わせ、客観的かつ鋭い洞察を提供してください。

回答は以下の構造を持ったJSON形式のみで出力してください。Markdown装飾(\`\`\`json等)は不要です。
{
  "summary": "140文字程度の全体サマリー",
  "deep_report": {
    "executive_summary": "詳細な全社分析テキスト（経営への総評・戦略進捗）",
    "correlation": "体温とKPIの相関分析（組織の健全性が成果にどう影響しているか）",
    "strategic_alignment": "直近の組織方針との整合性評価（現場の動きと経営方針の乖離）",
    "risks": "潜在的な中長期リスクと機会の指摘",
    "recommendations": "経営層が明日から打つべき具体的な一手（経営判断の材料）"
  },
  "insights_by_dept": {
    "部署ID": {
      "tone": "前向き・行動喚起|冷静・品質重視|共感・伴走|構造的・警告的",
      "text": "該当部署の現在のコンディションや組織方針を受けた専用の診断・応援メッセージ（100文字程度）"
    }
  },
  "matrix_analysis": {
    "1m": {
      "past_record": "【1ヶ月前の記録】過去の業績と体温について",
      "change": "【当時と今の比較】1ヶ月間での変化・推移",
      "retrospective": "振り返り: アラート発生時の分析"
    },
    "3m": {
      "past_record": "【3ヶ月前の記録】過去の業績と体温について",
      "change": "【当時と今の比較】3ヶ月間での変化・推移",
      "retrospective": "振り返り: 成果または課題の原因分析"
    },
    "6m": {
      "past_record": "【6ヶ月前の記録】過去の業績と体温について",
      "change": "【当時と今の比較】半年間での変化・推移",
      "retrospective": "振り返り: 長期的なマネジメントの良し悪しに関する考察"
    },
    "12m": {
      "past_record": "【1年前の記録】過去の業績と体温について",
      "change": "【当時と今の比較】1年間での変化・推移",
      "retrospective": "振り返り: 組織の成長痛や文化変容に関する深い考察"
    }
  },
  "department_feedback": [
    {
      "from_dept": "部署名",
      "to_dept": "部署名",
      "type": "positive|warning|alert|info",
      "text": "部署間の連携に関するフィードバックテキスト"
    }
  ],
  "suggested_actions": [
    { "title": "施策名", "description": "具体的な指示内容", "priority": "urgent|high|normal", "dept_name": "部署名または全社" }
  ],
  "semantic_summary": {
    "phase": "現在の組織フェーズ（例：スケール期、再構築期など）",
    "key_kpi": "最重要KPI",
    "top_agenda": "最優先アジェンダ"
  }
}`;

        const prompt = `対象月: ${latestMonth}
組織方針: ${policy}

過去の推移データ（参考）:
${JSON.stringify(historicalContext, null, 2)}

現在の詳細データ:
- 部署別統計: ${JSON.stringify(depts.data?.map(d => {
            const deptSurveys = surveys.data?.filter(s => s.department_id === d.id);
            const deptKpis = kpiRecs.data?.filter(r => r.department_id === d.id);
            const avgPulse = deptSurveys && deptSurveys.length > 0 
                ? deptSurveys.flatMap(s => s.survey_answers || []).reduce((acc, a) => acc + a.score, 0) / (deptSurveys.flatMap(s => s.survey_answers || []).length || 1)
                : 0;
            return {
                id: d.id,
                name: d.name,
                headcount: d.headcount,
                avg_pulse: avgPulse.toFixed(2),
                kpi_count: deptKpis?.length,
                kpi_details: deptKpis?.map(r => {
                    const def = kpiDefs.data?.find(def => def.id === r.kpi_definition_id);
                    return `${def?.name}: ${r.value}${def?.unit} (目標: ${r.target_value}${def?.unit})`;
                })
            };
        }))}
- KPI定義: ${JSON.stringify(kpiDefs.data?.map(k => ({ name: k.name, unit: k.unit })))}

分析の要件:
1. 全社的な傾向をサマリーしてください。
2. insights_by_dept には、提供された全ての部署IDに対して、その部署の状況と組織方針を掛け合わせた具体的なアドバイスを記述してください。
3. matrix_analysis には、過去（1m/3m/6m/12m）の推移データと現在を比較した洞察を、各時点ごとに記述してください。
4. suggested_actions は、即実行可能な具体的なアクションを少なくとも3つ提案してください。

JSONの構造に従い詳細な分析結果を出力してください。`;

        const aiResultRaw = await generateAIInsight(prompt, {
            systemPrompt,
            temperature: 0.2, // 決定論的で堅いアウトプットにするため低め
            maxTokens: 3000,  // 出力が増えるためMaxTokensを増やす
            model: "claude-3-7-sonnet-20250219"
        });

        const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
        const aiResult = JSON.parse(cleanJson);

        // 5. 結果をDBに保存
        const { error: insertError } = await supabase.from('ai_insights').insert({
            company_id: companyId,
            insight_type: 'full_report', // または 'comprehensive'などに変更も可
            target_month: latestMonth,
            content: aiResult,
            model_used: 'claude-3-7-sonnet-20250219'
        });

        if (insertError) throw insertError;

        // アクションを action_items に保存
        if (aiResult.suggested_actions) {
            const actionsToInsert = aiResult.suggested_actions.map((a: any) => {
                const dept = depts.data?.find(d => d.name === a.dept_name);
                return {
                    company_id: companyId,
                    department_id: dept?.id || null,
                    title: a.title,
                    description: a.description,
                    priority: a.priority,
                    is_ai_generated: true,
                    status: 'pending'
                };
            });
            await supabase.from('action_items').insert(actionsToInsert);
        }

        return NextResponse.json({ success: true, data: aiResult });

    } catch (error: any) {
        console.error("[AI Analyze API Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
