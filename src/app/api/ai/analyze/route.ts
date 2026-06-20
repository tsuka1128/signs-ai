import { applyGuardrailsToAIResult } from "@/lib/ai-guardrails";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";
import { NextResponse } from "next/server";
import { normalizeMonth, getLastNMonths } from "@/lib/utils/date";
import { sendAiSummaryNotification, sendAnomalyAlertNotification } from "@/lib/notifications-server";

export const runtime = "nodejs"; // Edge RuntimeではなくNode.jsで実行（maxDuration延長のため）
export const maxDuration = 300; // Vercel Pro: 最大300秒

const DEFAULT_SYSTEM_PROMPT = `あなたは組織改善AI「Signs AI」の経営参謀です。
組織の状態（アンケートスコア）と業績（KPI）、さらにリソース（人数・人件費）を、会社が定めた「組織方針」に照らし合わせ、客観的かつ鋭い洞察を提供してください。
人件費データが提供されている場合は、一人当たり生産性やコスト効率（ROI）の観点も含めて分析してください。

【絶対に守る出力ルール】
1. 匿名性の厳守：個人名・特定の役職者個人を指す表現は一切出力しないこと（すべてのフィールドが対象。insights_by_dept・voice_topics・suggested_actions の title/description も含む）。分析・提言は必ず「部署・層」を主語にする。
   ✕「○○さんが調整コストを問題視している」「コトラーは今週中に〜する」
   ◯「プロダクト部門で調整コストへの課題認識が見られる」「マーケティング部門は今週中に〜する」
   個人名（人名）を主語・目的語に使わず、部署名で表現すること。
2. 口調：すべての文末は「です・ます」調。経営者と対等な相棒として書く。命令・断定（〜すべきだ）を避け、提案形（〜が有効です／〜をお勧めします）を用いる。上から目線の表現は禁止。
3. 重複の排除：全社サマリーで述べた内容を部署別・トピック別で繰り返さないこと。複数部署に共通する課題は voice_topics に1つに統合し関連部署を併記する（部署別では繰り返さない）。各コメント欄は「その欄でしか読めない情報」を必ず含めること。
4. 業種・文脈の反映：組織情報（業種・事業フェーズ・規模）が与えられている場合は、その業種特有の力学を加味した示唆を最低1つ含めること。文脈を無視した汎用論は避ける。

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
  "risk_reason": "highの場合のみ、異常の理由を1文で記載",
  "matrix_insight": {
    "dept": "人数×KPI達成率×体温の部署マトリックスから注目すべき部署と打ち手を2〜3文で述べたテキスト（個人名なし）",
    "axis": "第2軸（プロダクトなど）の規模×成果×健康度のマトリックスから注目すべき第2軸の傾向と打ち手を2〜3文で述べたテキスト（個人名なし）"
  }
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
        const last15Months = getLastNMonths(15);
        const last13Months = last15Months.slice(2); // インデックス2以降（過去13ヶ月）
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
            resources,
            questionsRes
        ] = await Promise.all([
            supabase.from('departments').select('*').eq('company_id', companyId),
            supabase.from('kpi_definitions').select('*').eq('company_id', companyId),
            // survey_responses.recorded_month は YYYY-MM 形式で保存されるため、最古の対象月（latestMonthから14ヶ月前）
            // 以降の範囲フィルタにし、月の突合は後段の getTrailing3Months / summarizeMonth が処理する。
            supabase.from('survey_responses')
                .select('*, survey_answers(*)')
                .eq('company_id', companyId)
                .gte('recorded_month', last15Months[0].slice(0, 7)),
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
                .in('recorded_month', targetMonths),
            supabase.from('survey_questions')
                .select('id, text, category')
                .or(`company_id.is.null,company_id.eq.${companyId}`)
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
        ]);
        
        if (!depts.data || depts.data.length === 0) {
            return NextResponse.json({ error: "分析対象の部署が登録されていません。部署設定を先に完了させてください。" }, { status: 400 });
        }
        if (!surveys.data || surveys.data.length === 0) {
            return NextResponse.json({ error: "診断に必要なアンケート回答データ（ボイスチェック実績）が不足しています。" }, { status: 400 });
        }

        const activeQuestions = questionsRes.data || [];

        const getTrailing3Months = (baseMonth: string): string[] => {
            const idx = last15Months.indexOf(normalizeMonth(baseMonth));
            if (idx === -1) {
                return [normalizeMonth(baseMonth)];
            }
            const months = [];
            for (let i = 2; i >= 0; i--) {
                const targetIdx = idx - i;
                if (targetIdx >= 0) {
                    months.push(last15Months[targetIdx]);
                }
            }
            return months;
        };

        const summarizeMonth = (month: string) => {
            const trailingMonths = getTrailing3Months(month);
            const trailingSurveys = surveys.data?.filter(s => 
                trailingMonths.includes(normalizeMonth(s.recorded_month))
            ) || [];
            const monthKpis = kpiRecs.data?.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(month)) || [];
            
            // 各レスポンス内での question_id の重複排除
            const uniqueAnswers: Array<{ response_id: string; question_id: number; score: number }> = [];
            trailingSurveys.forEach(s => {
                const seenQuestionIds = new Set<number>();
                const answers = s.survey_answers || [];
                answers.forEach((a: any) => {
                    if (a.question_id != null && !seenQuestionIds.has(a.question_id)) {
                        seenQuestionIds.add(a.question_id);
                        uniqueAnswers.push({
                            response_id: s.id,
                            question_id: a.question_id,
                            score: a.score
                        });
                    }
                });
            });

            const avgPulse = uniqueAnswers.length > 0 
                ? uniqueAnswers.reduce((acc, a) => acc + a.score, 0) / uniqueAnswers.length
                : 0;

            // 直近3ヶ月の各単月スコア推移（古い順）
            const monthlyPulseTrend = trailingMonths.map(m => {
                const singleMonthSurveys = surveys.data?.filter(s => 
                    normalizeMonth(s.recorded_month) === m
                ) || [];

                const singleMonthAnswers: Array<{ response_id: string; question_id: number; score: number }> = [];
                const respondentsSet = new Set<string>();

                singleMonthSurveys.forEach(s => {
                    const seenQuestionIds = new Set<number>();
                    const answers = s.survey_answers || [];
                    answers.forEach((a: any) => {
                        if (a.question_id != null && !seenQuestionIds.has(a.question_id)) {
                            seenQuestionIds.add(a.question_id);
                            singleMonthAnswers.push({
                                response_id: s.id,
                                question_id: a.question_id,
                                score: a.score
                            });
                        }
                    });

                    const respondentKey = s.user_id || s.fingerprint || s.id;
                    respondentsSet.add(respondentKey);
                });

                const pulse = singleMonthAnswers.length > 0
                    ? parseFloat((singleMonthAnswers.reduce((acc, a) => acc + a.score, 0) / singleMonthAnswers.length).toFixed(2))
                    : null;

                return {
                    month: m,
                    pulse,
                    respondents: respondentsSet.size
                };
            });

            // 設問別平均スコアの算出
            const questionScoresMap = new Map<number, number[]>();
            uniqueAnswers.forEach(a => {
                if (!questionScoresMap.has(a.question_id)) {
                    questionScoresMap.set(a.question_id, []);
                }
                questionScoresMap.get(a.question_id)!.push(a.score);
            });

            const questionScores = (activeQuestions || []).map(q => {
                const scores = questionScoresMap.get(q.id) || [];
                const avg = scores.length > 0
                    ? parseFloat((scores.reduce((acc, s) => acc + s, 0) / scores.length).toFixed(2))
                    : null;
                return {
                    category: q.category || "custom",
                    label: q.text,
                    avg
                };
            }).filter(qs => qs.avg !== null);
            
            return {
                month,
                avg_pulse: uniqueAnswers.length > 0 ? avgPulse.toFixed(2) : null,
                monthly_pulse_trend: monthlyPulseTrend,
                kpi_count: monthKpis.length,
                kpi_summary: monthKpis.map(r => {
                    const def = kpiDefs.data?.find(d => d.id === r.kpi_definition_id);
                    const polarity = def?.is_higher_better !== false ? "最大化目標" : "最小化目標";
                    return `${def?.name || 'KPI'}: ${r.value}${def?.unit || ''} (目標: ${r.target_value}${def?.unit || ''}, 評価基準: ${polarity})`;
                }),
                question_scores: questionScores
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
            const trailingMonths = getTrailing3Months(latestMonth);
            const deptTrailingSurveys = surveys.data?.filter(s => 
                s.department_id === d.id && 
                trailingMonths.includes(normalizeMonth(s.recorded_month))
            ) || [];
            const deptKpis = kpiRecs.data?.filter(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            const deptResource = resources.data?.find(r => r.department_id === d.id && normalizeMonth(r.recorded_month) === normalizeMonth(latestMonth));
            
            // 各レスポンス内での question_id の重複排除
            const uniqueAnswers: Array<{ response_id: string; question_id: number; score: number }> = [];
            deptTrailingSurveys.forEach(s => {
                const seenQuestionIds = new Set<number>();
                const answers = s.survey_answers || [];
                answers.forEach((a: any) => {
                    if (a.question_id != null && !seenQuestionIds.has(a.question_id)) {
                        seenQuestionIds.add(a.question_id);
                        uniqueAnswers.push({
                            response_id: s.id,
                            question_id: a.question_id,
                            score: a.score
                        });
                    }
                });
            });

            const avgScore = uniqueAnswers.length > 0 
                ? uniqueAnswers.reduce((acc, a) => acc + a.score, 0) / uniqueAnswers.length
                : 0;
            
            deptScores.push({ deptId: d.id, deptName: d.name, avgScore });

            // 部署ごとの回答者数（3ヶ月累計のレスポンス数）
            const respondentCount = deptTrailingSurveys.length;

            // 部署別の直近3ヶ月の各単月スコア推移（古い順）
            const monthlyPulseTrend = trailingMonths.map(m => {
                const singleMonthSurveys = surveys.data?.filter(s => 
                    s.department_id === d.id &&
                    normalizeMonth(s.recorded_month) === m
                ) || [];

                const singleMonthAnswers: Array<{ response_id: string; question_id: number; score: number }> = [];
                const respondentsSet = new Set<string>();

                singleMonthSurveys.forEach(s => {
                    const seenQuestionIds = new Set<number>();
                    const answers = s.survey_answers || [];
                    answers.forEach((a: any) => {
                        if (a.question_id != null && !seenQuestionIds.has(a.question_id)) {
                            seenQuestionIds.add(a.question_id);
                            singleMonthAnswers.push({
                                response_id: s.id,
                                question_id: a.question_id,
                                score: a.score
                            });
                        }
                    });

                    const respondentKey = s.user_id || s.fingerprint || s.id;
                    respondentsSet.add(respondentKey);
                });

                const pulse = singleMonthAnswers.length > 0
                    ? parseFloat((singleMonthAnswers.reduce((acc, a) => acc + a.score, 0) / singleMonthAnswers.length).toFixed(2))
                    : null;

                return {
                    month: m,
                    pulse,
                    respondents: respondentsSet.size
                };
            });

            // 部署別の設問別平均スコアの算出
            const questionScoresMap = new Map<number, number[]>();
            uniqueAnswers.forEach(a => {
                if (!questionScoresMap.has(a.question_id)) {
                    questionScoresMap.set(a.question_id, []);
                }
                questionScoresMap.get(a.question_id)!.push(a.score);
            });

            const questionScores = (activeQuestions || []).map(q => {
                const scores = questionScoresMap.get(q.id) || [];
                const avg = scores.length > 0
                    ? parseFloat((scores.reduce((acc, s) => acc + s, 0) / scores.length).toFixed(2))
                    : null;
                return {
                    category: q.category || "custom",
                    label: q.text,
                    avg
                };
            }).filter(qs => qs.avg !== null);

            // スコアが 3.0 未満の低スコア項目を抽出
            const lowScoreItems = questionScores
                .filter(qs => qs.avg !== null && qs.avg < 3.0)
                .sort((a, b) => (a.avg || 0) - (b.avg || 0))
                .map(qs => `${qs.label}: ${qs.avg}`);

            const comments = deptTrailingSurveys.map(s => s.free_comment).filter(Boolean) || [];
            return {
                id: d.id,
                name: d.name,
                master_headcount: d.headcount,
                actual_headcount: deptResource?.head_count,
                labor_cost: deptResource?.labor_cost,
                avg_pulse: uniqueAnswers.length > 0 ? avgScore.toFixed(2) : null,
                monthly_pulse_trend: monthlyPulseTrend,
                respondent_count_3m: respondentCount,
                question_scores: questionScores,
                low_score_items: lowScoreItems,
                kpi_count: deptKpis?.length,
                kpi_details: deptKpis?.map(r => {
                    const def = kpiDefs.data?.find(def => def.id === r.kpi_definition_id);
                    return `${def?.name}: ${r.value}${def?.unit} (目標: ${r.target_value}${def?.unit})`;
                }),
                voice_comments: comments
            };
        });
        const policy = semantic.data?.content || "組織方針がまだ設定されていません。";

        // 過去のアクション提案履歴を取得（重複排除用）
        const { data: pastActions } = await supabase
            .from('action_items')
            .select('title, status, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(60);

        const pastActionsSummary = pastActions && pastActions.length > 0
            ? pastActions.map((a: { title: string; status: string; created_at: string }) => {
                const label = a.status === 'rejected' ? '❌不採用' :
                              a.status === 'accepted' ? '▶実行中' :
                              a.status === 'completed' ? '✅完了' :
                              a.status === 'kept' ? '⏸キープ' : '⏳未判断';
                return `${label}: ${a.title}`;
              }).join('\n')
            : null;

        const prompt = `対象月: ${latestMonth}
各データセクションは ### DATA START と ### DATA END で区切られています。

【重要：体温データの特性と分析における解釈ルール】
- 本データにおいて、組織の「体温」（avg_pulse）および設問別スコア（question_scores）は、当月を含む「直近3ヶ月の移動平均（トレーリング平均）」で算出されています。これは安定した基調指標であり、誤検知を避けるための土台です。
- 一方で、「月次推移データ」（monthly_pulse_trend）は、各月の「単月スコアと回答者数」を表す速報シグナルです。最新月ほど現在の状態を表しますが、回答数（respondents）が少ない月は個人の主観に振れるため鵜呑みにしないでください。
- 着眼点として、「3ヶ月平均（avg_pulse）」と「直近月の単月スコア（monthly_pulse_trendの最新月）」の乖離（例: 平均は横ばいだが直近単月で急落している＝要注視）、および「月次推移」の向き（上昇/下降トレンド）を捉え、急変の兆しを早期に指摘してください。
- 業績データ「KPI」は「当月単月」の値です。
- 直近3ヶ月の組織の健康状態（体温）が、当月の成果（KPI）にどう現れているかという相関を分析してください。すでに移動平均化されているため、AI側で時間的なズレ（翌月ラグなど）を考慮した二重ラグ解釈をしないでください。
- 回答総数（respondent_count_3m）が少ない部署については、個人の主観が強く影響するため、断定的な因果関係の決めつけを避け、仮説として慎重に言及してください。

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
${pastActionsSummary ? `
### DATA START (過去の提案履歴・重複排除用)
# 過去の提案履歴（必ず参照すること）
${pastActionsSummary}

【厳守ルール】
- 上記のいずれとも「実質的に同じ内容」の提案は絶対にしないこと
- ❌不採用 の提案は、組織が明示的に却下した提案であるため、再提案禁止
- ▶実行中 / ⏳未判断 の提案は、既に対処中または検討中であるため、再提案禁止
- ✅完了 した提案は、次のステップ・発展形を提案すること（同じ内容の再提案は禁止）
- ⏸キープ の提案は、来月以降の候補として温存されているため、そのまま再提案しないこと
- 上記を全て考慮した上で、まだ手をつけていない新しい課題・改善領域を発見して提案すること
### DATA END
` : ''}
分析の要件:
1. 全社的な傾向をサマリーしてください。
2. insights_by_dept には、全ての部署に対する診断テキストを含めてください。
3. voice_topics には、各部署から集まった「voice_comments（定性コメント）」を分析し、共通する課題や喜びを3〜5つのトピックに抽象化して抽出してください（※個人名や具体的すぎる業務内容は伏せること）。
4. matrix_analysis には、過去と現在の推移データに基づく洞察を記述してください。また、deep_report.correlation においては、特にスコアの低いカテゴリ（テーマ）を名指しし、それが当月のどのKPIに効いている可能性があるかを具体的に述べてください。
5. suggested_actions は、即実行可能な具体的なアクションを少なくとも3つ提案してください。
6. matrix_insight には、現在の「部署マトリックス」および「第2軸（プロダクト等）マトリックス」のデータ配置（規模 × 成果 × 体温）から、注目すべき傾向やボトルネックと打つべき支援策を、それぞれ2〜3文で簡潔に読み解いたコメントを出力してください。
   - 出力JSONの最上位キーに "matrix_insight": { "dept": "...", "axis": "..." } というオブジェクトを必ず含めてください。
   - dept: 部署マトリックスの読み解き
   - axis: 第2軸マトリックスの読み解き（第2軸が設定されていない場合は一般的なコメントでよい）
   - ※ 匿名性を厳守し、個人名や特定の個人を指す表現、具体的すぎる単一業務名は絶対に出力しないこと。

JSONの構造に従い詳細な分析結果を出力してください。`;

        // ── タイムアウト制御（Vercel Pro: maxDuration=300秒を考慮して240秒で切る） ──
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 240000);

        let aiResult: any;

        try {
            const aiResultRaw = await generateAIInsight(prompt, {
                systemPrompt,
                temperature: sysSettings['temperature'] ?? 0.2,
                maxTokens: sysSettings['max_tokens'] ?? 3000,
                model: sysSettings['default_model'] ?? "claude-sonnet-4-5",
                apiKey: sysSettings['anthropic_api_key'],
                signal: controller.signal
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
                console.error("AI Analysis Timeout Error: Request took longer than 240s");
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
            model_used: sysSettings['default_model'] ?? 'claude-sonnet-4-5',
            updated_at: new Date().toISOString()
        }, { onConflict: 'company_id, target_month, insight_type' });

        if (insertError) throw insertError;
 
        // ---- hr_strategy の生成・保存（full_report と同一リクエスト内で実行）----
        try {
            const hrDeptSummary = (deptDetails ?? []).map((d: any) => {
                const laborCostPerHead = (d.labor_cost && d.actual_headcount)
                    ? Math.round(d.labor_cost / d.actual_headcount * 10) / 10
                    : 0;
                const lowScoresStr = d.low_score_items && d.low_score_items.length > 0
                    ? `（低スコア項目: ${d.low_score_items.join(", ")}）`
                    : "";
                const avgPulseStr = d.avg_pulse !== null ? d.avg_pulse : "データなし";
                return `【${d.name}】体温:${avgPulseStr}${lowScoresStr} KPI:${d.kpi_details?.join(" / ") || "なし"} 1人あたり人件費:${laborCostPerHead}万円`;
            }).join("\n");

            const hrSystemPrompt = `あなたは人材マネジメントの専門家です。組織データを分析し、具体的かつ実行可能な人事戦略を提言してください。

以下の3点を必ず含めてください：
① リスク対応（緊急）：体温・KPIが低迷している部署への即時施策
② エンゲージメント改善：体温低下の主因と優先改善項目  
③ 中長期の人事戦略：体制・報酬・育成の観点での提言

各セクションは3〜4行で簡潔に。全体で400字以内を目安にしてください。`;

            const hrPrompt = `対象月: ${latestMonth}（※体温は当月を含む直近3ヶ月の移動平均）\n\n■ 部署別データ\n${hrDeptSummary || "データなし"}`;

            const hrStrategy = await generateAIInsight(hrPrompt, {
                systemPrompt: hrSystemPrompt,
                maxTokens: 800,
                model: sysSettings['default_model'],
                temperature: 0.5,
                apiKey: sysSettings['anthropic_api_key'],
                signal: AbortSignal.timeout(20000),
            });

            await supabase.from('ai_insights').upsert({
                company_id: companyId,
                insight_type: 'hr_strategy',
                target_month: latestMonth,
                content: { strategy: hrStrategy },
                model_used: sysSettings['default_model'] ?? 'claude-sonnet-4-5',
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
                link: "/?sec=report",
                targetRole: "admin",
                targetDepartmentId: null,
            });
            void createNotification({
                companyId,
                type: "ai_analysis_done",
                title: "AI分析が完了しました",
                body: `${targetMonthLabel} の分析レポートが生成されました`,
                link: "/?sec=report",
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
                        link: `/dept?dept=${dept.id}`,
                        targetRole: "manager",
                        targetDepartmentId: dept.id,
                    });
                }
            }
        })();

        // アクションを action_items に保存（月1回まで。AI分析を月に複数回実行しても提案は重複生成しない）
        if (aiResult.suggested_actions) {
            // 今月すでにAI生成アクションが存在するかチェック
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { count: existingAiActionCount } = await supabase
                .from('action_items')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('is_ai_generated', true)
                .gte('created_at', monthStart);

            if (!existingAiActionCount || existingAiActionCount === 0) {
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
                        status: 'pending',
                        is_ai_generated: true
                    };
                });
                const { error: actionInsertError } = await supabase.from('action_items').insert(actionsToInsert);
                if (actionInsertError) {
                    console.error("action_items insert error:", actionInsertError, "payload sample:", actionsToInsert[0]);
                }
            } else {
                console.log(`action_items: 今月は既にAI提案を生成済み（${existingAiActionCount}件）のため新規生成をスキップ`);
            }
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
