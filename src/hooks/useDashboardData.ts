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
}

export function useDashboardData(company: Company | null, supabase: any) {
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
        realActionItems: []
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const last13Months = useMemo(() => getLastNMonths(13), []);
    const monthLabels = useMemo(() => getMonthLabels(last13Months), [last13Months]);
    const fullMonthLabels = useMemo(() => getFullMonthLabels(last13Months), [last13Months]);

    const loadData = useCallback(async () => {
        if (!company) return;

        const [d, k, s, r, a, recs, resources, ai, act] = await Promise.all([
            supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('semantic_layers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
            supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', company.id),
            supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
            supabase.from('kpi_records').select('*').in('recorded_month', last13Months),
            supabase.from('resource_records').select('*').in('recorded_month', last13Months),
            supabase.from('ai_insights').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(1),
            supabase.from('action_items').select('*').eq('company_id', company.id).eq('is_archived', false).order('created_at', { ascending: false })
        ]);

        let mergedKpis: any[] = [];
        if (k.data && k.data.length > 0) {
            const latestMonth = last13Months[12];
            mergedKpis = k.data.map((def: any) => {
                const records = (recs.data || []).filter((rec: any) => rec.kpi_definition_id === def.id && rec.axis_id === null);
                const latest = records.find((rec: any) => normalizeMonth(rec.recorded_month) === latestMonth);

                const history = last13Months.map(m => {
                    const r = records.find((rec: any) => normalizeMonth(rec.recorded_month) === m);
                    return r ? r.value : 0;
                });

                const targetHistory = last13Months.map(m => {
                    const r = records.find((rec: any) => normalizeMonth(rec.recorded_month) === m);
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
            realActionItems: act.data || []
        });
    }, [company, last13Months, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const latestAi = state.realAiInsights[0];
    const aiContent = latestAi?.content as any;

    const currentSurveyData = useMemo(() => {
        // Logic for currentSurveyData (aggregated pulse/response rate)
        // ... based on orgView (moved to component side for better tab control)
        return (orgView: string) => {
            let filtered = state.realResponses;
            let viewName = "全社";
            let targetHeadcount = state.realDepts.reduce((sum, d) => sum + (d.headcount || 0), 0);

            const surveyViewId = (orgView === "product" || orgView === "dept" || orgView === "all") ? "all" : orgView;

            if (surveyViewId !== "all") {
                const dept = state.realDepts.find(d => d.id === surveyViewId);
                const axis = state.realAxes.find(a => a.id === surveyViewId);
                viewName = dept ? dept.name : (axis ? axis.name : "不明なターゲット");
                filtered = state.realResponses.filter(r => r.department_id === surveyViewId || r.axis_id === surveyViewId);
                targetHeadcount = dept ? (dept.headcount || 0) : (axis ? (axis.headcount || 0) : 0);
            }

            const latestMonth = last13Months[12];
            const prevMonth = last13Months[11];
            
            const latestResponses = filtered.filter(r => normalizeMonth(r.recorded_month) === latestMonth);
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

            const prevQScores = questions.map((_, qi) => {
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

            return { viewName, scores: qScores, prevScores: prevQScores, pulse: avgPulse, pulseHistory, aiComment: comment, responseCount, responseRate };
        };
    }, [state.realResponses, state.realDepts, state.realAxes, last13Months, aiContent]);

    const displayDepts = useMemo(() => {
        return state.realDepts.map(d => {
            const latestMonth = last13Months[12];
            const deptResponses = state.realResponses.filter(r => r.department_id === d.id);
            const latestAnswers = deptResponses
                .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
                .flatMap(r => r.survey_answers || []);

            const pulseScore = latestAnswers.length > 0
                ? latestAnswers.reduce((sum, a) => sum + (a as any).score, 0) / latestAnswers.length
                : 0;

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

            const respondentsCount = deptResponses.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

            const mKpis = state.realKpis.filter(k => k.owner_dept_id === d.id);
            const mRecs = state.realKpiRecords.filter(r => r.recorded_month === last13Months[12]);
            
            let totalAch = 0;
            let count = 0;
            mKpis.forEach(def => {
                const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null);
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
                head: `${headHistory[12]} / ${d.headcount || 0}`,
                respondentsCount,
                masterHeadcount: d.headcount || 0,
                headHistory,
                productivity: calculateProductivity(kpiAch, pulseScore),
                pulse: Number(pulseScore.toFixed(1)),
                pulseHistory,
                weather: getWeatherFromPulse(pulseScore),
                arrow: "flat",
                kpiAch,
                kpis: state.realKpis.filter(k => k.owner_dept_id === d.id)
                    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
                    .map((k: any) => ({
                        name: k.name,
                        val: `${k.val ?? 0}${k.unit ?? ''}`,
                        ach: (k.target_value && k.target_value > 0) ? Math.round((k.val / k.target_value) * 100) : 0,
                        type: "stack"
                    })).slice(0, 3) as any[],
                kpiName: state.realKpis.find(k => k.owner_dept_id === d.id && k.is_main)?.name ||
                        state.realKpis.find(k => k.owner_dept_id === d.id)?.name || "",
                productivityHistory: last13Months.map((month, idx) => {
                    const mRecs = state.realKpiRecords.filter(r => r.recorded_month === month);
                    let tAch = 0;
                    let c = 0;
                    mKpis.forEach(def => {
                        const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null);
                        if (rec && rec.target_value !== null) {
                            const ach = calculateAchievementRate(rec.value, rec.target_value, def.is_higher_better !== false);
                            if (ach !== null) {
                                tAch += ach;
                                c++;
                            }
                        }
                    });
                    const avgAch = c > 0 ? tAch / c : 100;
                    return calculateProductivity(avgAch, pulseHistory[idx]);
                })
            };
        });
    }, [state.realDepts, state.realResponses, state.realKpis, state.realKpiRecords, state.realResources, last13Months]);

    const displayKpis = useMemo(() => {
        return state.realKpis.map(k => ({
            ...k,
            id: `kpi_${k.id}`,
            dept: state.realDepts.find(d => d.id === k.owner_department_id)?.name || "",
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

            const pulseScore = latestAnswers.length > 0
                ? latestAnswers.reduce((sum, a) => sum + (a as any).score, 0) / latestAnswers.length
                : 0;

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

            const mRecs = state.realKpiRecords.filter(r => r.recorded_month === last13Months[12] && r.axis_id === axis.id);
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
                head: `${activeHead} / ${axis.headcount || 0}`,
                respondentsCount: activeHead,
                masterHeadcount: axis.headcount || 0,
                headHistory,
                xAxisHead: axis.headcount || 0,
                sizeValue: sizeHistory[12],
                sizeHistory,
                productivity: calculateProductivity(kpiAch, pulseScore),
                kpiAch,
                mrr: sizeHistory[12],
                pulse: Number(pulseScore.toFixed(1)),
                pulseHistory,
                weather: getWeatherFromPulse(pulseScore),
                arrow: "flat",
                kpis: state.realKpis.map(def => {
                    const rec = state.realKpiRecords.find(r => r.kpi_definition_id === def.id && r.axis_id === axis.id && normalizeMonth(r.recorded_month) === latestMonth);
                    if (!rec) return null;
                    return {
                        name: def.name,
                        val: `${(rec.value || 0).toLocaleString()}${def.unit || ''}`,
                        ach: (rec.target_value && rec.target_value > 0) ? Math.round((rec.value / rec.target_value) * 100) : 0,
                        type: "stack"
                    };
                }).filter(Boolean).slice(0, 3) as any[],
                productivityHistory: last13Months.map((month, idx) => {
                    const mRecsMonth = state.realKpiRecords.filter(r => r.recorded_month === month && r.axis_id === axis.id);
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
                    const avgAch = c > 0 ? tAch / c : 100;
                    return calculateProductivity(avgAch, pulseHistory[idx]);
                })
            };
        });
    }, [state.realAxes, state.realResponses, state.realKpiRecords, state.realKpis, state.realResources, company, last13Months]);

    const handleRunAnalyze = async () => {
        if (!company) return;
        try {
            setIsAnalyzing(true);
            const res = await fetch('/api/ai/analyze', { method: 'POST' });
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

    const deptTabs = useMemo(() => [
        { id: "all", label: "全社" },
        ...state.realDepts.map(d => ({ id: d.id, label: d.name }))
    ], [state.realDepts]);

    return {
        state: { ...state, isAnalyzing, last13Months, monthLabels, fullMonthLabels, aiContent },
        derived: { currentSurveyData, displayDepts, displayKpis, displayAxes, deptTabs },
        handlers: { handleRunAnalyze, handleSaveSemantic, handleDeleteSemantic }
    };
}
