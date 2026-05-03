"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Company, Department, KpiDefinition, KpiAxis, User, Invitation, ResourceRecord, SemanticLayer, AiInsight, ActionItem, KpiRecord, SurveyResponse } from "@/types/database";
import { normalizeMonth, getLastNMonths, getMonthLabels, getFullMonthLabels } from "@/lib/utils/date";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/constants";
import { calculateAchievementRate, calculateProductivity, getWeatherFromPulse, calculateGrowthRate } from "@/lib/logic/kpi-engine";

interface DashboardState {
    realDepts: Department[];
    realKpis: any[];
    realSem: string;
    realSemHistory: SemanticLayer[];
    realResponses: any[];
    realAxes: KpiAxis[];
    realKpiRecords: KpiRecord[];
    realResources: ResourceRecord[];
    realAiInsights: AiInsight[];
    realActionItems: ActionItem[];
    realUsers: any[];
    latestSurveyMonth: string | null;
    latestKpiMonth: string | null;
}

export function useDashboardData(
    company: Company | null, 
    supabase: any, 
    isImpersonating?: boolean,
    userRole?: string | null,
    userDepartmentId?: string | null
) {
    const [state, setState] = useState<DashboardState>({
        realDepts: [],
        realKpis: [],
        realSem: "",
        realSemHistory: [],
        realResponses: [],
        realAxes: [],
        realKpiRecords: [],
        realResources: [],
        realAiInsights: [],
        realActionItems: [],
        realUsers: [],
        latestSurveyMonth: null,
        latestKpiMonth: null
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const last13Months = useMemo(() => getLastNMonths(13), []);
    const monthLabels = useMemo(() => getMonthLabels(last13Months), [last13Months]);
    const fullMonthLabels = useMemo(() => getFullMonthLabels(last13Months), [last13Months]);

    const loadData = useCallback(async () => {
        if (!company) return;

        // Step 1: 基本データをフェッチ
        const [d, k, s, r, a, ai, act, users] = await Promise.all([
            supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('semantic_layers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
            supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', company.id),
            supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('ai_insights').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(1),
            supabase.from('action_items').select('*').eq('company_id', company.id).eq('is_archived', false).order('created_at', { ascending: false }),
            supabase.from('users').select('id, department_id, axis_id').eq('company_id', company.id)
        ]);

        const kpiIds = (k.data || []).map((def: any) => def.id);

        // Step 2: KPI実績とリソース実績をフェッチ（安全な絞り込み）
        const [recs, resources] = await Promise.all([
            kpiIds.length > 0 
                ? supabase.from('kpi_records').select('*').in('kpi_definition_id', kpiIds).in('recorded_month', last13Months)
                : Promise.resolve({ data: [] }),
            supabase.from('resource_records').select('*').eq('company_id', company.id).in('recorded_month', last13Months)
        ]);

        // データが存在する最新月を特定する
        const latestSurveyMonth = [...last13Months].reverse().find(m => 
            (r.data || []).some((res: any) => normalizeMonth(res.recorded_month) === m)
        ) || last13Months[12];

        const latestKpiMonth = [...last13Months].reverse().find(m => 
            (recs.data || []).some((res: any) => normalizeMonth(res.recorded_month) === m)
        ) || last13Months[12];

        let mergedKpis: any[] = [];
        if (k.data && k.data.length > 0) {
            mergedKpis = k.data.map((def: any) => {
                // そのKPI定義に関連するレコードを抽出
                const records = (recs.data || []).filter((rec: any) => rec.kpi_definition_id === def.id && rec.axis_id === null);
                
                // 部署に紐付かない「グローバル」なレコードを優先的に探す。
                const latest = records.find((rec: any) => normalizeMonth(rec.recorded_month) === latestKpiMonth && (rec.department_id === null || rec.department_id === def.owner_dept_id)) 
                            || records.find((rec: any) => normalizeMonth(rec.recorded_month) === latestKpiMonth);
                
                const history = last13Months.map(m => {
                    const r = records.find((rec: any) => normalizeMonth(rec.recorded_month) === m && (rec.department_id === null || rec.department_id === def.owner_dept_id))
                         || records.find((rec: any) => normalizeMonth(rec.recorded_month) === m);
                    return r ? r.value : 0;
                });

                const targetHistory = last13Months.map(m => {
                    const r = records.find((rec: any) => normalizeMonth(rec.recorded_month) === m && (rec.department_id === null || rec.department_id === def.owner_dept_id))
                         || records.find((rec: any) => normalizeMonth(rec.recorded_month) === m);
                    return r ? r.target_value : (def.target_default ?? 0);
                });

                return {
                    ...def,
                    val: latest ? latest.value : (def.val ?? 0),
                    target_value: latest ? latest.target_value : (def.target_default ?? 0),
                    prev: history,
                    targetHistory
                };
            });
        }

        setState({
            realDepts: d.data || [],
            realKpis: mergedKpis,
            realSem: (s.data && s.data.length > 0) ? s.data[0].content : "",
            realSemHistory: s.data || [],
            realResponses: r.data || [],
            realAxes: a.data || [],
            realKpiRecords: recs.data || [],
            realResources: resources.data || [],
            realAiInsights: ai.data || [],
            realActionItems: act.data || [],
            realUsers: users.data || [],
            latestSurveyMonth,
            latestKpiMonth
        });
    }, [company, last13Months, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const latestAi = state.realAiInsights[0];
    const aiContent = latestAi?.content as any;

    // --- 全組織の統計データ計算 (偏差値用) ---
    const allOrgsStats = useMemo(() => {
        const targetMonth = state.latestSurveyMonth;
        if (!targetMonth) return null;

        const orgs = [
            ...state.realDepts.map(d => ({ id: d.id, name: d.name, type: 'dept' })),
            ...state.realAxes.map(a => ({ id: a.id, name: a.name, type: 'axis' }))
        ];

        // 過去13ヶ月分の統計を計算
        const monthlyStats = last13Months.map(month => {
            const orgScores = orgs.map(org => {
                const filtered = state.realResponses.filter(r => 
                    (org.type === 'dept' ? r.department_id === org.id : r.axis_id === org.id) &&
                    normalizeMonth(r.recorded_month) === normalizeMonth(month)
                );
                const answers = filtered.flatMap(r => r.survey_answers || []);
                
                const qScores = DEFAULT_SURVEY_QUESTIONS.map((_, qi) => {
                    const vals = filtered.map(r => (r.survey_answers || [])[qi]?.score).filter(s => s !== undefined);
                    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                });

                const avgPulse = answers.length > 0 ? answers.reduce((a: number, b: any) => a + b.score, 0) / answers.length : 0;
                return { id: org.id, qScores, avgPulse };
            }).filter(o => o.avgPulse > 0);

            if (orgScores.length === 0) return null;

            const companyAvgPulse = orgScores.reduce((a, b) => a + b.avgPulse, 0) / orgScores.length;
            const companyQScores = DEFAULT_SURVEY_QUESTIONS.map((_, qi) => {
                const activeScores = orgScores.map(o => o.qScores[qi]).filter(s => s > 0);
                return activeScores.length > 0 ? activeScores.reduce((a, b) => a + b, 0) / activeScores.length : 0;
            });

            // 標準偏差と偏差値の算出関数
            const calculateDevs = (scores: number[], mean: number) => {
                const n = scores.length;
                if (n <= 1) return scores.map(() => 50);
                const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
                const std = Math.sqrt(variance);
                return scores.map(s => {
                    if (std === 0) return 50;
                    const dev = 50 + 10 * (s - mean) / std;
                    return Math.max(0, Math.min(100, Math.round(dev * 10) / 10));
                });
            };

            const totalDevs = calculateDevs(orgScores.map(o => o.avgPulse), companyAvgPulse);
            const questionDevs = DEFAULT_SURVEY_QUESTIONS.map((_, qi) => 
                calculateDevs(orgScores.map(o => o.qScores[qi]), companyQScores[qi])
            );

            const deviationsMap: Record<string, { total: number, questions: number[] }> = {};
            orgScores.forEach((org, idx) => {
                deviationsMap[org.id] = {
                    total: totalDevs[idx],
                    questions: DEFAULT_SURVEY_QUESTIONS.map((_, qi) => questionDevs[qi][idx])
                };
            });

            return { month, companyAvgPulse, companyQScores, deviationsMap, orgScores };
        });

        const latestStats = monthlyStats.find(s => s?.month === targetMonth) || monthlyStats.filter(s => s !== null).pop();

        return {
            latestStats,
            monthlyStats
        };
    }, [state.realResponses, state.realDepts, state.realAxes, state.latestSurveyMonth, last13Months]);

        const currentSurveyData = useCallback((passedOrgView: string) => {
        let filtered = state.realResponses;
        let viewName = "全社";
        let targetHeadcount = state.realDepts.reduce((sum, d) => sum + (d.headcount || 0), 0);

        const surveyViewId = (passedOrgView === "product" || passedOrgView === "dept" || passedOrgView === "all") ? "all" : passedOrgView;

        if (surveyViewId !== "all") {
            const dept = state.realDepts.find(d => d.id.trim() === surveyViewId.trim());
            const axis = state.realAxes.find(a => a.id.trim() === surveyViewId.trim());
            viewName = dept ? dept.name : (axis ? axis.name : "不明なターゲット");
            
            // 1. この組織（名前ベース含む）に紐付く全IDを収集
            const sameNameDeptIds = state.realDepts.filter(d => d.name === viewName).map(d => d.id);
            const sameNameAxisIds = state.realAxes.filter(a => a.name === viewName).map(a => a.id);
            const allTargetIds = Array.from(new Set([surveyViewId, ...sameNameDeptIds, ...sameNameAxisIds]));

            // 2. 回答データのフィルタリング
            filtered = state.realResponses.filter(r => {
                // 直接紐付いている場合
                if (r.department_id && allTargetIds.includes(r.department_id)) return true;
                if (r.axis_id && allTargetIds.includes(r.axis_id)) return true;

                return false;
            });
            
            targetHeadcount = dept
                ? (dept.headcount || state.realUsers.filter(u => u.department_id === dept.id).length)
                : (axis ? (axis.headcount || state.realUsers.filter(u => u.axis_id === axis.id).length) : 0);
        }

        const latestMonth = last13Months[12];
        const targetMonth = state.latestSurveyMonth || latestMonth;
        const isStale = normalizeMonth(targetMonth) !== normalizeMonth(latestMonth);
        const dataMonth = isStale ? `${parseInt(targetMonth.split('-')[1])}月` : null;

        let latestResponses = filtered.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(targetMonth));
        
        // もし会社全体の最新月でもその部署にデータがない場合は、さらに過去を探索する（念のための個別フォールバック）
        if (latestResponses.length === 0 && surveyViewId !== "all") {
            for (let i = last13Months.indexOf(targetMonth) - 1; i >= 0; i--) {
                const prevResponses = filtered.filter(r => normalizeMonth(r.recorded_month) === last13Months[i]);
                if (prevResponses.length > 0) {
                    latestResponses = prevResponses;
                    break;
                }
            }
        }

        const latestAnswers = latestResponses.flatMap(r => r.survey_answers || []);

        const responseCount = latestResponses.length;
        const responseRate = targetHeadcount > 0 ? Math.round((responseCount / targetHeadcount) * 100) : 0;

        const questions = DEFAULT_SURVEY_QUESTIONS;
        const qScores = questions.map((_, qi) => {
            const scoresForQ: number[] = [];
            latestResponses.forEach(r => {
                const ans = r.survey_answers || [];
                if (ans[qi]) scoresForQ.push(ans[qi].score);
            });
            if (scoresForQ.length === 0) return 0;
            return scoresForQ.reduce((sum, s) => sum + s, 0) / scoresForQ.length;
        });

        // 比較用の「そのさらに前月」
        const targetMonthIdx = last13Months.indexOf(targetMonth);
        const prevMonth = targetMonthIdx > 0 ? last13Months[targetMonthIdx - 1] : null;
        
        const prevQScores = questions.map((_, qi) => {
            if (!prevMonth) return 0;
            const scoresForQ: number[] = [];
            filtered
                .filter(r => normalizeMonth(r.recorded_month) === prevMonth)
                .forEach(r => {
                    const ans = r.survey_answers || [];
                    if (ans[qi]) scoresForQ.push(ans[qi].score);
                });
            if (scoresForQ.length === 0) return 0;
            return scoresForQ.reduce((sum, s) => sum + s, 0) / scoresForQ.length;
        });

        const avgPulse = latestAnswers.length > 0
            ? latestAnswers.reduce((sum, a) => sum + (a as any).score, 0) / latestAnswers.length
            : 0;

        const pulseHistory = last13Months.map(month => {
            const monthAnswers = filtered
                .filter(r => normalizeMonth(r.recorded_month) === month)
                .flatMap(r => r.survey_answers || []);
            if (monthAnswers.length === 0) return 0;
            return monthAnswers.reduce((sum, a) => sum + (a as any).score, 0) / monthAnswers.length;
        });

        let comment = aiContent?.summary || "回答データが蓄積されていません。";
        if (!aiContent && avgPulse > 0) {
            const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s > 0 && x.s < 3.0).sort((a, b) => a.s - b.s)[0];
            if (lowScoreQ) {
                comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。環境改善の検討が必要です。`;
            } else {
                comment = "全体的に良好な体温が維持されています。";
            }
        }

        const defaultVoiceTopics = [
            { id: "v_empty", topic: "データ収集中", sentiment: "neutral", abstractedVoice: "まだ現場の声が集まっていないか、AIによるトピック抽出がおこなわれていません。アンケート配信とAI分析を実行してください。", persona: "システム" }
        ];

        const topicsRaw = aiContent?.voice_topics;
        let finalVoiceTopics = defaultVoiceTopics;
        
        if (Array.isArray(topicsRaw)) {
            if (topicsRaw.length > 0) {
                finalVoiceTopics = topicsRaw.map((t: any, idx: number) => ({
                    id: t.id || `ai_voice_${idx}`,
                    topic: t.topic || "トピック不明",
                    sentiment: t.sentiment || "neutral",
                    abstractedVoice: t.abstractedVoice || "詳細なし",
                    persona: t.persona || "全社"
                }));
            } else {
                // 空配列の場合は「分析済みだが話題なし」
                finalVoiceTopics = [
                    { id: "v_none", topic: "トピックなし", sentiment: "neutral", abstractedVoice: "今月の回答内容に基づき分析をおこないましたが、共通する顕著な課題や話題は検出されませんでした。組織体温は安定しています。", persona: "システム" }
                ];
            }
        }

        // 偏差値データの取得
        const latestStats = allOrgsStats?.latestStats;
        const orgStats = latestStats?.deviationsMap[surveyViewId];
        const deviation = orgStats?.total || 50;
        const questionDeviations = orgStats?.questions || questions.map(() => 50);

        // 偏差値履歴の算出
        const deviationHistory = last13Months.map(month => {
            const stats = allOrgsStats?.monthlyStats.find(s => s?.month === month);
            return stats?.deviationsMap[surveyViewId]?.total || 0;
        });

        return { 
            viewName, 
            scores: qScores, 
            prevScores: prevQScores, 
            pulse: avgPulse, 
            pulseHistory, 
            deviationHistory,
            aiComment: comment, 
            responseCount, 
            responseRate, 
            voiceTopics: finalVoiceTopics as any[],
            isStale,
            dataMonth,
            deviation,
            questionDeviations,
            allOrgsStats: latestStats // 全社比較用（最新分のみ渡す）
        };
    }, [state.realResponses, state.realDepts, state.realAxes, state.realUsers, state.latestSurveyMonth, last13Months, aiContent, allOrgsStats]);

    const displayDepts = useMemo(() => {
        let depts = state.realDepts;

        // manager は自部署のみ
        if (userRole === 'manager' && userDepartmentId) {
            depts = depts.filter(d => d.id === userDepartmentId);
        }

        return depts.map(d => {
            const latestMonth = last13Months[12];
            const deptResponses = state.realResponses.filter(r => r.department_id === d.id);
            const latestAnswers = deptResponses
                .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
                .flatMap(r => r.survey_answers || []);

            // 今月データがなければ直近月にフォールバック
            let pulseScore = latestAnswers.length > 0
                ? latestAnswers.reduce((sum, a) => sum + (a as any).score, 0) / latestAnswers.length
                : 0;
            let isStale = false;
            let dataMonth: string | null = null;

            if (latestAnswers.length === 0) {
                for (let i = last13Months.length - 2; i >= 0; i--) {
                    const prevAnswers = deptResponses
                        .filter(r => normalizeMonth(r.recorded_month) === last13Months[i])
                        .flatMap(r => r.survey_answers || []);
                    if (prevAnswers.length > 0) {
                        pulseScore = prevAnswers.reduce((sum, a) => sum + (a as any).score, 0) / prevAnswers.length;
                        isStale = true;
                        // 「3月」のような表示用ラベルを生成
                        dataMonth = `${parseInt(last13Months[i].split('-')[1])}月`;
                        break;
                    }
                }
            }

            const pulseHistory = last13Months.map(month => {
                const monthAnswers = deptResponses
                    .filter(r => normalizeMonth(r.recorded_month) === month)
                    .flatMap(r => r.survey_answers || []);
                if (monthAnswers.length === 0) return 0;
                return monthAnswers.reduce((sum, a) => sum + (a as any).score, 0) / monthAnswers.length;
            });

            const headHistory = last13Months.map(month => {
                const res = state.realResources.find(rr => rr.department_id === d.id && normalizeMonth(rr.recorded_month) === month);
                return res ? res.head_count : 0;
            });
            const activeUserCount = state.realUsers.filter(u => u.department_id === d.id).length;
            const latestResource = state.realResources.find(rr => rr.department_id === d.id && normalizeMonth(rr.recorded_month) === latestMonth);
            const latestLabor = latestResource?.labor_cost || 0;
            const latestActualHead = latestResource?.head_count || activeUserCount;
            const laborCostPerHead = (latestLabor > 0 && latestActualHead > 0) ? Math.round((latestLabor / latestActualHead / 10000) * 10) / 10 : 0;

            const respondentsCount = deptResponses.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

            const mKpis = state.realKpis.filter(k => k.owner_dept_id === d.id);
            // 今月データがない（isStale）場合は、dataMonth（フォールバック先）のレコードを使用
            const targetMonthStr = isStale && dataMonth 
                ? last13Months.find(m => m.includes(`-${dataMonth.replace('月', '').padStart(2, '0')}-`)) || last13Months[12]
                : last13Months[12];
            
            const mRecs = state.realKpiRecords.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(targetMonthStr));

            let totalAch = 0;
            let count = 0;
            mKpis.forEach(def => {
                // department_id が設定されているレコードを優先。なければ owner_dept_id で紐付いた旧形式にフォールバック
                const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null && (r.department_id === d.id || (r.department_id === null && def.owner_dept_id === d.id)));
                if (rec && rec.target_value !== null) {
                    const ach = calculateAchievementRate(rec.value, rec.target_value, def.is_higher_better !== false);
                    if (ach !== null) {
                        totalAch += ach;
                        count++;
                    }
                }
            });
            const kpiAch = count > 0 ? Math.round(totalAch / count) : 0;

            return {
                id: d.id,
                name: d.name,
                head: `${headHistory[12] || activeUserCount} / ${activeUserCount}`,
                respondentsCount,
                masterHeadcount: activeUserCount,
                headHistory,
                laborCostPerHead,
                totalLaborCost: latestLabor,
                productivity: calculateProductivity(kpiAch, pulseScore),
                pulse: Number(pulseScore.toFixed(1)),
                pulseHistory,
                weather: getWeatherFromPulse(pulseScore),
                arrow: "flat",
                kpiAch,
                hasKpiData: count > 0,
                isStale,
                dataMonth,
                kpis: mKpis
                    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
                    .map((def: any) => {
                        const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null && (r.department_id === d.id || (r.department_id === null && def.owner_dept_id === d.id)));
                        return {
                            name: def.name,
                            val: rec ? `${(rec.value || 0).toLocaleString()}${def.unit || ''}` : `-${def.unit || ''}`,
                            ach: (rec && rec.target_value && rec.target_value > 0) ? Math.round((rec.value / rec.target_value) * 100) : 0,
                            type: "stack"
                        };
                    }).slice(0, 3) as any[],
                kpiName: state.realKpis.find(k => k.owner_dept_id === d.id && k.is_main)?.name ||
                        state.realKpis.find(k => k.owner_dept_id === d.id)?.name || "",
                productivityHistory: last13Months.map((month, idx) => {
                    const mRecs = state.realKpiRecords.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(month));
                    let tAch = 0;
                    let c = 0;
                    mKpis.forEach(def => {
                        const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null && (r.department_id === d.id || (r.department_id === null && def.owner_dept_id === d.id)));
                        if (rec && rec.target_value !== null) {
                            const ach = calculateAchievementRate(rec.value, rec.target_value, def.is_higher_better !== false);
                            if (ach !== null) {
                                tAch += ach;
                                c++;
                            }
                        }
                    });
                    const avgAch = c > 0 ? tAch / c : 0;
                    return calculateProductivity(avgAch, pulseHistory[idx]);
                })
            };
        });
    }, [state.realDepts, state.realResponses, state.realKpis, state.realKpiRecords, state.realResources, last13Months, userRole, userDepartmentId]);

    const displayKpis = useMemo(() => {
        return state.realKpis.map(k => ({
            ...k,
            id: `kpi_${k.id}`,
            dept: state.realDepts.find(d => d.id === k.owner_dept_id)?.name || "",
            voices: [],
            yoy: calculateGrowthRate(Number((k as any).prev?.[12]), Number((k as any).prev?.[0]))
        }));
    }, [state.realKpis, state.realDepts]);

    const displayAxes = useMemo(() => {
        return state.realAxes.map(axis => {
            const latestMonth = last13Months[12];
            const axisResponses = state.realResponses.filter(r => r.axis_id === axis.id);
            const latestAnswers = axisResponses
                .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
                .flatMap(r => r.survey_answers || []);

            // 今月データがなければ直近月にフォールバック
            let pulseScore = latestAnswers.length > 0
                ? latestAnswers.reduce((sum, a) => sum + (a as any).score, 0) / latestAnswers.length
                : 0;
            let isStale = false;
            let dataMonth: string | null = null;

            if (latestAnswers.length === 0) {
                for (let i = last13Months.length - 2; i >= 0; i--) {
                    const prevAnswers = axisResponses
                        .filter(r => normalizeMonth(r.recorded_month) === last13Months[i])
                        .flatMap(r => r.survey_answers || []);
                    if (prevAnswers.length > 0) {
                        pulseScore = prevAnswers.reduce((sum, a) => sum + (a as any).score, 0) / prevAnswers.length;
                        isStale = true;
                        dataMonth = `${parseInt(last13Months[i].split('-')[1])}月`;
                        break;
                    }
                }
            }

            const pulseHistory = last13Months.map(month => {
                const monthAnswers = axisResponses
                    .filter(r => normalizeMonth(r.recorded_month) === month)
                    .flatMap(r => r.survey_answers || []);
                if (monthAnswers.length === 0) return 0;
                return monthAnswers.reduce((sum, a) => sum + (a as any).score, 0) / monthAnswers.length;
            });

            const activeHead = axisResponses.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

            const sizeHistory = last13Months.map(month => {
                const sizeRec = state.realKpiRecords.find(rec =>
                    rec.axis_id === axis.id &&
                    rec.kpi_definition_id === company?.secondary_axis_size_kpi_id &&
                    normalizeMonth(rec.recorded_month) === month
                );
                return sizeRec ? sizeRec.value : 0;
            });

            const headHistory = last13Months.map(month => {
                const res = state.realResources.find(rr => rr.axis_id === axis.id && normalizeMonth(rr.recorded_month) === month);
                return res ? res.head_count : 0;
            });
            const activeUserCount = state.realUsers.filter(u => u.axis_id === axis.id).length;
            const latestResource = state.realResources.find(rr => rr.axis_id === axis.id && normalizeMonth(rr.recorded_month) === latestMonth);
            const latestLabor = latestResource?.labor_cost || 0;
            const latestActualHead = latestResource?.head_count || activeUserCount;
            const laborCostPerHead = (latestLabor > 0 && latestActualHead > 0) ? Math.round((latestLabor / latestActualHead / 10000) * 10) / 10 : 0;

            const targetMonthStr = isStale && dataMonth 
                ? last13Months.find(m => m.includes(`-${dataMonth.replace('月', '').padStart(2, '0')}-`)) || last13Months[12]
                : last13Months[12];
            
            const mRecs = state.realKpiRecords.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(targetMonthStr) && r.axis_id === axis.id);
            let totalAch = 0;
            let count = 0;
            mRecs.forEach(rec => {
                const def = state.realKpis.find(k => k.id === rec.kpi_definition_id);
                const ach = calculateAchievementRate(rec.value, rec.target_value, def?.is_higher_better !== false);
                if (ach !== null) {
                    totalAch += ach;
                    count++;
                }
            });
            const kpiAch = count > 0 ? Math.round(totalAch / count) : 0;

            return {
                id: axis.id,
                name: axis.name,
                head: `${activeHead} / ${activeUserCount}`,
                respondentsCount: activeHead,
                masterHeadcount: activeUserCount,
                headHistory,
                laborCostPerHead,
                totalLaborCost: latestLabor,
                xAxisHead: activeUserCount,
                sizeValue: sizeHistory[12],
                sizeHistory,
                productivity: calculateProductivity(kpiAch, pulseScore),
                kpiAch,
                hasKpiData: mRecs.length > 0,
                mrr: sizeHistory[12],
                pulse: Number(pulseScore.toFixed(1)),
                pulseHistory,
                weather: getWeatherFromPulse(pulseScore),
                arrow: "flat",
                isStale,
                dataMonth,
                kpis: state.realKpis.map(def => {
                    const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === axis.id);
                    if (!rec) return null;
                    return {
                        name: def.name,
                        val: `${(rec.value || 0).toLocaleString()}${def.unit || ''}`,
                        ach: (rec.target_value && rec.target_value > 0) ? Math.round((rec.value / rec.target_value) * 100) : 0,
                        type: "stack"
                    };
                }).filter(Boolean).slice(0, 3) as any[],
                productivityHistory: last13Months.map((month, idx) => {
                    const mRecsMonth = state.realKpiRecords.filter(r => normalizeMonth(r.recorded_month) === normalizeMonth(month) && r.axis_id === axis.id);
                    let tAch = 0;
                    let c = 0;
                    mRecsMonth.forEach(rec => {
                        const def = state.realKpis.find(k => k.id === rec.kpi_definition_id);
                        const ach = calculateAchievementRate(rec.value, rec.target_value, def?.is_higher_better !== false);
                        if (ach !== null) {
                            tAch += ach;
                            c++;
                        }
                    });
                    const avgAch = c > 0 ? tAch / c : 0;
                    return calculateProductivity(avgAch, pulseHistory[idx]);
                })
            };
        });
    }, [state.realAxes, state.realResponses, state.realKpiRecords, state.realKpis, state.realResources, company, last13Months]);

    const handleRunAnalyze = async () => {
        if (!company) return;

        const msg = isImpersonating 
            ? "【注意】現在は代理ログイン中です。他社の本番データを書き換えますが、本当にAI分析を実行しますか？"
            : "AI分析を実行しますか？現在のデータに基づきインサイトを生成します。";
        
        if (typeof window !== "undefined" && !confirm(msg)) return;

        try {
            setIsAnalyzing(true);
            const res = await fetch('/api/ai/analyze', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetCompanyId: company.id })
            });
            if (res.ok) {
                await loadData();
                alert("AI分析が完了しました。");
            } else {
                const result = await res.json();
                alert("AI分析に失敗しました: " + result.error);
            }
        } catch (err) {
            alert("AI分析の実行中にエラーが発生しました。");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveSemantic = async (txt: string) => {
        if (!company) return;
        const { data: newSem, error: semErr } = await supabase.from('semantic_layers').insert({
            company_id: company.id,
            content: txt,
            valid_from: new Date().toISOString()
        }).select('*').single();

        if (!semErr && newSem) {
            setState(prev => ({
                ...prev,
                realSem: txt,
                realSemHistory: [newSem, ...prev.realSemHistory]
            }));
        }
    };

    const handleDeleteSemantic = async (id: string) => {
        const backup = [...state.realSemHistory];
        setState(prev => ({ ...prev, realSemHistory: prev.realSemHistory.filter(h => h.id !== id) }));

        try {
            const res = await fetch(`/api/semantic-layers?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const result = await res.json();
                alert(`削除に失敗しました: ${result.error || '不明なエラー'}`);
                setState(prev => ({ ...prev, realSemHistory: backup }));
            }
        } catch (err) {
            alert('削除中にエラーが発生しました');
            setState(prev => ({ ...prev, realSemHistory: backup }));
        }
    };

    const financialMetrics = useMemo(() => {
        const latestMonth = last13Months[12];
        const deptsLabor = state.realDepts.map(d => {
            const res = state.realResources.find(rr => rr.department_id === d.id && normalizeMonth(rr.recorded_month) === latestMonth);
            return res?.labor_cost || 0;
        });
        const axesLabor = state.realAxes.map(a => {
            const res = state.realResources.find(rr => rr.axis_id === a.id && normalizeMonth(rr.recorded_month) === latestMonth);
            return res?.labor_cost || 0;
        });

        const deptsLaborSum = deptsLabor.reduce((a, b) => a + b, 0);
        const axesLaborSum = axesLabor.reduce((a, b) => a + b, 0);

        // 部署側人件費データを優先、無ければ領域側を使う（二重カウント防止）
        const rawTotalLaborCost = deptsLaborSum > 0 ? deptsLaborSum : axesLaborSum;
        const totalLaborCost = Math.round(rawTotalLaborCost / 10000); // 万円単位に変換
        const hasLaborData = rawTotalLaborCost > 0;

        if (!hasLaborData) return { hasLaborData: false, laborRoi: 0, laborDistRate: 0, totalLaborCost: 0 };

        // ROI = (Avg KPI Achievement) / (Total Labor Cost(万円) / 100)  -- Simple Index
        const allAch = [...displayDepts, ...displayAxes].map(d => d.kpiAch);
        const avgAch = allAch.length > 0 ? allAch.reduce((a, b) => a + b, 0) / allAch.length : 0;
        const laborRoi = totalLaborCost > 0 ? Math.round((avgAch / (totalLaborCost / 100)) * 10) / 10 : 0;

        // Distribution Rate = Total Labor / Total Revenue
        const revenueKpis = state.realKpis.filter(k => k.is_revenue === true);
        let totalRevenue = 0;
        revenueKpis.forEach(k => {
            totalRevenue += (k.val || 0);
        });

        const laborDistRate = totalRevenue > 0 ? Math.round((rawTotalLaborCost / totalRevenue) * 100) : 0;

        const deptFinanceData = displayDepts.map(d => ({
            id: d.id,
            name: d.name,
            laborCostPerHead: d.laborCostPerHead,
            totalLaborCost: d.totalLaborCost,
            kpiAch: d.kpiAch,
            pulse: d.pulse,
            prevPulse: d.pulseHistory?.[11] ?? d.pulse,
            prevLaborCostPerHead: (() => {
                const prevResource = state.realResources.find(rr => 
                    rr.department_id === d.id && 
                    !rr.axis_id && 
                    normalizeMonth(rr.recorded_month) === last13Months[11]
                );
                return prevResource?.labor_cost && prevResource?.head_count 
                    ? Math.round((prevResource.labor_cost / prevResource.head_count / 10000) * 10) / 10 
                    : d.laborCostPerHead;
            })(),
            headcount: d.headHistory?.[12] || 0,
            laborRoi: d.totalLaborCost > 0 ? Math.round((d.kpiAch / (d.totalLaborCost / 1000000)) * 10) / 10 : 0
        }));

        const axisFinanceData = displayAxes.map(a => ({
            id: a.id,
            name: a.name,
            laborCostPerHead: a.laborCostPerHead,
            totalLaborCost: a.totalLaborCost,
            kpiAch: a.kpiAch,
            pulse: a.pulse,
            prevPulse: a.pulseHistory?.[11] ?? a.pulse,
            prevLaborCostPerHead: (() => {
                const prevResource = state.realResources.find(rr => 
                    rr.axis_id === a.id && 
                    normalizeMonth(rr.recorded_month) === last13Months[11]
                );
                return prevResource?.labor_cost && prevResource?.head_count 
                    ? Math.round((prevResource.labor_cost / prevResource.head_count / 10000) * 10) / 10 
                    : a.laborCostPerHead;
            })(),
            headcount: a.headHistory?.[12] || 0,
            laborRoi: a.totalLaborCost > 0 ? Math.round((a.kpiAch / (a.totalLaborCost / 1000000)) * 10) / 10 : 0
        }));

        const deptsActualHead = displayDepts.reduce((sum, d) => sum + (d.headHistory?.[12] || 0), 0);
        const axesActualHead = displayAxes.reduce((sum, a) => sum + (a.headHistory?.[12] || 0), 0);
        
        // 部署側人数を優先、無ければ領域側を使う
        const totalActualHead = deptsActualHead > 0 ? deptsActualHead : axesActualHead;
        const avgLaborCostPerHead = totalActualHead > 0 ? Math.round((totalLaborCost / totalActualHead) * 10) / 10 : 0;

        return { hasLaborData, laborRoi, laborDistRate, totalLaborCost, deptFinanceData, axisFinanceData, avgLaborCostPerHead };
    }, [state.realResources, state.realDepts, state.realAxes, state.realKpis, displayDepts, displayAxes, last13Months]);

    const deptTabs = useMemo(() => {
        let depts = state.realDepts;
        if (userRole === 'manager' && userDepartmentId) {
            depts = depts.filter(d => d.id === userDepartmentId);
            // manager には「全社」タブを表示しない
            return depts.map(d => ({ id: d.id, label: d.name }));
        }
        return [
            { id: "all", label: "全社" },
            ...depts.map(d => ({ id: d.id, label: d.name }))
        ];
    }, [state.realDepts, userRole, userDepartmentId]);

    return {
        state: { ...state, isAnalyzing, last13Months, monthLabels, fullMonthLabels, aiContent, ...financialMetrics },
        derived: { getCurrentSurveyData: currentSurveyData, displayDepts, displayKpis, displayAxes, deptTabs },
        handlers: { handleRunAnalyze, handleSaveSemantic, handleDeleteSemantic }
    };
}
