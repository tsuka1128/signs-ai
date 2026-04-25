import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";
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

        // 2. ユーザーのプロフィール取得（ロール確認含む）
        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        let companyId = profile?.company_id;

        // 3. 管理者による企業指定の処理（リクエストボディから取得）
        try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            if (body.targetCompanyId && profile?.role === 'super_admin') {
                companyId = body.targetCompanyId;
            }
        } catch (e) {
            // ボディがない場合やパース失敗時はスキップ
        }

        if (!companyId) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        // ── レート制限チェック（サーバーサイド強制・月次自動リセット付） ──
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data: companyData } = await supabase
            .from('companies')
            .select('manual_ai_runs_used_this_month, manual_ai_runs_active_month, plan_id, plan_overrides')
            .eq('id', companyId)
            .single();

        const { data: planData } = await supabase
            .from('plans')
            .select('manual_ai_runs_per_month')
            .eq('id', companyData?.plan_id)
            .single();

        const overrides = (companyData as any)?.plan_overrides || {};
        const maxRuns = overrides.manual_ai_runs_per_month ?? planData?.manual_ai_runs_per_month ?? 1;
        
        // 月が変わっている場合は、カウンターを実質0として扱う（保存は後ほど実行成功時に行う）
        let usedRuns = companyData?.manual_ai_runs_used_this_month ?? 0;
        const lastActiveMonth = companyData?.manual_ai_runs_active_month;

        if (lastActiveMonth !== currentMonthStr) {
            usedRuns = 0;
        }

        if (usedRuns >= maxRuns && profile?.role !== 'super_admin') {
            return NextResponse.json({
                error: `今月のAI分析実行回数の上限（${maxRuns}回）に達しました。来月までお待ちいただくか、プランのアップグレードをご検討ください。`,
                limit: maxRuns,
                used: usedRuns,
                reset_month: currentMonthStr
            }, { status: 429 });
        }

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
            semantic,
            resources
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
                .single(),
            supabase.from('resource_records')
                .select('*')
                .eq('company_id', companyId)
                .in('recorded_month', targetMonths)
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
                    const polarity = def?.is_higher_better !== false ? "最大化目標" : "最小化目標";
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
組織の状態（アンケートスコア）と業績（KPI）、さらにリソース（人数・人件費）を、会社が定めた「組織方針」に照らし合わせ、客観的かつ鋭い洞察を提供してください。
人件費データが提供されている場合は、一人当たり生産性やコスト効率（ROI）の観点も含めて分析してください。

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
  "voice_topics": [
    {
      "topic": "話題（例：評価の透明性、業務効率化、チームワークなど）",
      "sentiment": "positive|neutral|negative",
      "abstractedVoice": "生声（フリーコメント）から抽出・意訳した、ペルソナごとの代弁コメント（1〜2文程度）。個人が特定されない表現にすること。",
      "persona": "どのような層からの声か（例：営業部門の若手、全社の管理職など）"
    }
  ],
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
            const deptSurveys = surveys.data?.filter(s => s.department_id === d.id && normalizeMonth(s.recorded_month) === normalizeMonth(latestMonth));
            const deptKpis = kpiRecs.data?.filter(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            const deptResource = resources.data?.find(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            const avgPulse = deptSurveys && deptSurveys.length > 0 
                ? deptSurveys.flatMap(s => s.survey_answers || []).reduce((acc, a) => acc + a.score, 0) / (deptSurveys.flatMap(s => s.survey_answers || []).length || 1)
                : 0;
            const comments = deptSurveys?.map(s => s.free_comment).filter(Boolean) || [];
            return {
                id: d.id,
                name: d.name,
                master_headcount: d.headcount,
                actual_headcount: deptResource?.head_count,
                labor_cost: deptResource?.labor_cost,
                avg_pulse: avgPulse.toFixed(2),
                kpi_count: deptKpis?.length,
                kpi_details: deptKpis?.map(r => {
                    const def = kpiDefs.data?.find(def => def.id === r.kpi_definition_id);
                    return `${def?.name}: ${r.value}${def?.unit} (目標: ${r.target_value}${def?.unit})`;
                }),
                voice_comments: comments
            };
        }))}
- KPI定義: ${JSON.stringify(kpiDefs.data?.map(k => ({ name: k.name, unit: k.unit })))}

分析の要件:
1. 全社的な傾向をサマリーしてください。
2. insights_by_dept には、全ての部署に対する診断テキストを含めてください。
3. voice_topics には、各部署から集まった「voice_comments（定性コメント）」を分析し、共通する課題や喜びを3〜5つのトピックに抽象化して抽出してください（※個人名や具体的すぎる業務内容は伏せること）。
4. matrix_analysis には、過去と現在の推移データに基づく洞察を記述してください。
5. suggested_actions は、即実行可能な具体的なアクションを少なくとも3つ提案してください。

JSONの構造に従い詳細な分析結果を出力してください。`;

        // 4.1 システム設定の取得
        const sysSettings = await getSystemSettings();

        const aiResultRaw = await generateAIInsight(prompt, {
            systemPrompt,
            temperature: sysSettings['temperature'] ?? 0.2,
            maxTokens: sysSettings['max_tokens'] ?? 3000,
            model: sysSettings['default_model'] ?? "claude-3-7-sonnet-20250219",
            apiKey: sysSettings['anthropic_api_key']
        });

        // ── AI回答のJSON解析（堅牢化） ──
        let aiResult: any;
        try {
            const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
            aiResult = JSON.parse(cleanJson);
        } catch (jsonError) {
            console.error("[AI JSON Parse Error]:", jsonError, "Raw Data:", aiResultRaw);
            return NextResponse.json({ 
                error: "AIの回答を解析できませんでした。再度実行をお試しください。",
                detail: "Invalid JSON format from AI model" 
            }, { status: 502 });
        }

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

        // ── AI実行回数カウンターの更新（インクリメント & 月の同期） ──
        await supabase
            .from('companies')
            .update({ 
                manual_ai_runs_used_this_month: usedRuns + 1,
                manual_ai_runs_active_month: currentMonthStr
            })
            .eq('id', companyId);

        return NextResponse.json({  success: true, data: aiResult });

    } catch (error: any) {
        console.error("AI Analysis API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
