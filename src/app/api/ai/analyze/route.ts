import { applyGuardrailsToAIResult } from "@/lib/ai-guardrails";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";
import { NextResponse } from "next/server";
import { normalizeMonth, getLastNMonths } from "@/lib/utils/date";
import { sendAiSummaryNotification, sendAnomalyAlertNotification } from "@/lib/notifications-server";

const DEFAULT_SYSTEM_PROMPT = `あなたは組織改善AI「Signs AI」の経営コンサルタントです。
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
      "change": "【当時と今の変化】半年間での変化・推移",
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
      "from_dept_id": "送信元部署ID",
      "to_dept_id": "送信先部署ID",
      "type": "positive|warning|alert|info",
      "text": "部署間の連携に関するフィードバックテキスト"
    }
  ],
  "suggested_actions": [
    { "title": "施策名", "description": "具体的な指示内容", "priority": "urgent|high|normal", "dept_id": "部署IDまたはnull(全社の場合)" }
  ],
  "semantic_summary": {
    "phase": "現在の組織フェーズ（例：スケール期、再構築期など）",
    "key_kpi": "最重要KPI",
    "top_agenda": "最優先アジェンダ"
  },
  "risk_level": "low|medium|high",
  "risk_reason": "highの場合のみ、異常の理由を1文で記載"
}

注: risk_level は以下の基準で判定してください。
- high: 組織に緊急対応が必要な兆候がある（スコアの急落、複数部門での同時悪化、戦略との深刻な乖離など）。
- medium: 注視が必要な兆候がある。
- low: 正常範囲内。`;

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const sysSettings = await getSystemSettings();
        const systemPrompt = sysSettings['base_system_prompt'] || DEFAULT_SYSTEM_PROMPT;

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
        
        if (!depts.data || depts.data.length === 0) {
            return NextResponse.json({ error: "分析対象の部署が登録されていません。部署設定を先に完了させてください。" }, { status: 400 });
        }
        if (!surveys.data || surveys.data.length === 0) {
            return NextResponse.json({ error: "診断に必要なアンケート回答データ（ボイスチェック実績）が不足しています。" }, { status: 400 });
        }

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

        // 部署別データの集約とスコア集計
        const deptScores: { deptId: string; deptName: string; avgScore: number }[] = [];
        const deptDetails = depts.data?.map(d => {
            const deptSurveys = surveys.data?.filter(s => s.department_id === d.id && normalizeMonth(s.recorded_month) === normalizeMonth(latestMonth));
            const deptKpis = kpiRecs.data?.filter(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            const deptResource = resources.data?.find(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            const avgScore = deptSurveys && deptSurveys.length > 0 
                ? deptSurveys.flatMap(s => s.survey_answers || []).reduce((acc, a) => acc + a.score, 0) / (deptSurveys.flatMap(s => s.survey_answers || []).length || 1)
                : 0;
            
            deptScores.push({ deptId: d.id, deptName: d.name, avgScore });

            const comments = deptSurveys?.map(s => s.free_comment).filter(Boolean) || [];
            return {
                id: d.id,
                name: d.name,
                master_headcount: d.headcount,
                actual_headcount: deptResource?.head_count,
                labor_cost: deptResource?.labor_cost,
                avg_pulse: avgScore.toFixed(2),
                kpi_count: deptKpis?.length,
                kpi_details: deptKpis?.map(r => {
                    const def = kpiDefs.data?.find(def => def.id === r.kpi_definition_id);
                    return `${def?.name}: ${r.value}${def?.unit} (目標: ${r.target_value}${def?.unit})`;
                }),
                voice_comments: comments
            };
        });
        const policy = semantic.data?.content || "組織方針がまだ設定されていません。";

        const prompt = `対象月: ${latestMonth}
各データセクションは ### DATA START と ### DATA END で区切られています。

### DATA START (組織方針・フェーズ)
組織方針: ${policy}
セマンティック設定: ${JSON.stringify(semantic.data || {})}
### DATA END

### DATA START (過去の推移データ)
${JSON.stringify(historicalContext, null, 2)}
### DATA END

### DATA START (現在の詳細データ)
- 部署別詳細: ${JSON.stringify(deptDetails)}
- KPI定義: ${JSON.stringify(kpiDefs.data?.map(k => ({ name: k.name, unit: k.unit })))}
### DATA END

分析の要件:
1. 全社的な傾向をサマリーしてください。
2. insights_by_dept には、全ての部署に対する診断テキストを含めてください。
3. voice_topics には、各部署から集まった「voice_comments（定性コメント）」を分析し、共通する課題や喜びを3〜5つのトピックに抽象化して抽出してください（※個人名や具体的すぎる業務内容は伏せること）。
4. matrix_analysis には、過去と現在の推移データに基づく洞察を記述してください。
5. suggested_actions は、即実行可能な具体的なアクションを少なくとも3つ提案してください。

JSONの構造に従い詳細な分析結果を出力してください。`;

        // ── タイムアウト制御（Vercel Pro 上限 60秒 を考慮して 55秒で切る） ──
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        let aiResult: any;

        try {
            const aiResultRaw = await generateAIInsight(prompt, {
                systemPrompt,
                temperature: sysSettings['temperature'] ?? 0.2,
                maxTokens: sysSettings['max_tokens'] ?? 3000,
                model: sysSettings['default_model'] ?? "claude-3-7-sonnet-20250219",
                apiKey: sysSettings['anthropic_api_key'],
                signal: controller.signal,
                companyId,
                agentName: "CPO Elon",
                purpose: "ai_analysis"
            });
            clearTimeout(timeoutId);

            // ── AI回答のJSON解析（堅牢化） ──
            try {
                const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
                aiResult = JSON.parse(cleanJson);

                // ── AI ガードレール適用 ──
                const { result: guardedResult, allWarnings } = applyGuardrailsToAIResult(aiResult);
                aiResult = guardedResult;

                if (allWarnings.length > 0) {
                    console.warn(`[Guardrails Applied] Company: ${companyId}, Issues: ${allWarnings.length}`);
                }
            } catch (jsonError) {
                console.error("[AI JSON Parse Error]:", jsonError, "Raw Data:", aiResultRaw);
                return NextResponse.json({ 
                    error: "AIの回答を解析できませんでした。再度実行をお試しください。",
                    detail: "Invalid JSON format from AI model" 
                }, { status: 502 });
            }
        } catch (error: any) {
            clearTimeout(timeoutId); 
            if (error.name === 'AbortError') {
                console.error("AI Analysis Timeout Error: Request took longer than 55s");
                return NextResponse.json({ 
                    error: "AI分析がタイムアウトしました。分析範囲を絞るか、再度実行してください。",
                    detail: "Vercel timeout limit reached" 
                }, { status: 504 });
            }
            throw error;
        }

        // 5. 結果をDBに保存
        const { error: insertError } = await supabase.from('ai_insights').upsert({
            company_id: companyId,
            insight_type: 'full_report',
            target_month: latestMonth,
            content: aiResult,
            model_used: sysSettings['default_model'] ?? 'claude-3-7-sonnet-20250219',
            updated_at: new Date().toISOString()
        }, { onConflict: 'company_id, target_month, insight_type' });

        if (insertError) throw insertError;
 
        // ---- hr_strategy の生成・保存（full_report と同一リクエスト内で実行）----
        try {
            const hrDeptSummary = (deptDetails ?? []).map((d: any) => {
                const laborCostPerHead = (d.labor_cost && d.actual_headcount)
                    ? Math.round(d.labor_cost / d.actual_headcount * 10) / 10
                    : 0;
                return `【${d.name}】体温:${d.avg_pulse} KPI:${d.kpi_details?.join(" / ") || "なし"} 1人あたり人件費:${laborCostPerHead}万円`;
            }).join("\n");

            const hrSystemPrompt = `あなたは人材マネジメントの専門家です。組織データを分析し、具体的かつ実行可能な人事戦略を提言してください。

以下の3点を必ず含めてください：
① リスク対応（緊急）：体温・KPIが低迷している部署への即時施策
② エンゲージメント改善：体温低下の主因と優先改善項目  
③ 中長期の人事戦略：体制・報酬・育成の観点での提言

各セクションは3〜4行で簡潔に。全体で400字以内を目安にしてください。`;

            const hrPrompt = `対象月: ${latestMonth}\n\n■ 部署別データ\n${hrDeptSummary || "データなし"}`;

            const hrStrategy = await generateAIInsight(hrPrompt, {
                systemPrompt: hrSystemPrompt,
                maxTokens: 800,
                model: sysSettings['default_model'],
                temperature: 0.5,
                apiKey: sysSettings['claude_api_key'],
                signal: AbortSignal.timeout(20000),
                companyId,
                agentName: "CHRO Drucker",
                purpose: "hr_strategy"
            });

            await supabase.from('ai_insights').upsert({
                company_id: companyId,
                insight_type: 'hr_strategy',
                target_month: latestMonth,
                content: { strategy: hrStrategy },
                model_used: sysSettings['default_model'] ?? 'claude-3-7-sonnet-20250219',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'company_id, target_month, insight_type' });

        } catch (hrError) {
            // hr_strategy 生成失敗はメイン分析の成否に影響させない
            console.error("[hr-strategy] 生成失敗（full_report は保存済み）:", hrError);
        }

        // 通知を作成
        void (async () => {
            const targetMonthLabel = latestMonth.substring(0, 7);
            
            void createNotification({
                companyId,
                type: "ai_analysis_done",
                title: "AI分析が完了しました",
                body: `${targetMonthLabel} の分析レポートが生成されました`,
                link: "/history",
                targetRole: "admin",
                targetDepartmentId: null,
            });
            void createNotification({
                companyId,
                type: "ai_analysis_done",
                title: "AI分析が完了しました",
                body: `${targetMonthLabel} の分析レポートが生成されました`,
                link: "/history",
                targetRole: "executive",
                targetDepartmentId: null,
            });

            if (depts.data) {
                for (const dept of depts.data) {
                    void createNotification({
                        companyId,
                        type: "ai_analysis_done",
                        title: "AI分析が完了しました",
                        body: `${targetMonthLabel} の ${dept.name} の分析レポートが生成されました`,
                        link: "/history",
                        targetRole: "manager",
                        targetDepartmentId: dept.id,
                    });
                }
            }
        })();

        // アクションを action_items に保存
        if (aiResult.suggested_actions) {
            const actionsToInsert = aiResult.suggested_actions.map((a: any) => {
                const targetDeptId = a.dept_id;
                const resolvedDeptId = depts.data?.find(d => d.id === targetDeptId)?.id || 
                                     depts.data?.find(d => d.name === a.dept_id)?.id || null;
                
                return {
                    company_id: companyId,
                    department_id: resolvedDeptId,
                    title: a.title,
                    description: a.description,
                    priority: a.priority,
                    is_ai_generated: true,
                    status: 'pending'
                };
            });
            await supabase.from('action_items').insert(actionsToInsert);
        }

        await supabase
            .from('companies')
            .update({ 
                manual_ai_runs_used_this_month: usedRuns + 1,
                manual_ai_runs_active_month: currentMonthStr
            })
            .eq('id', companyId);

        void sendAiSummaryNotification(companyId);

        const currentAvgPulse = historicalContext.current.avg_pulse
            ? parseFloat(historicalContext.current.avg_pulse as string)
            : 0;
        const previousAvgPulse = historicalContext["1m"]?.avg_pulse
            ? parseFloat(historicalContext["1m"].avg_pulse as string)
            : null;

        if (currentAvgPulse > 0) {
            void sendAnomalyAlertNotification(
                companyId,
                currentAvgPulse,
                previousAvgPulse,
                deptScores,
                aiResult.risk_level ?? 'low',
                aiResult.risk_reason ?? null
            );
        }

        return NextResponse.json({ success: true, data: aiResult });

    } catch (error: any) {
        console.error("AI Analysis API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
