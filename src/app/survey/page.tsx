"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { TabBar } from "@/components/ui/TabBar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/constants";
import { normalizeMonth, getLastNMonths, getMonthLabels } from "@/lib/utils/date";
import { useCompany } from "@/hooks/useCompany";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileQuestion } from "lucide-react";

const questions = DEFAULT_SURVEY_QUESTIONS;

// モックデータ定数を削除し、状態管理に移行

export default function SurveyDashboard() {
    const router = useRouter();
    const [view, setView] = useState("all");
    const [depts, setDepts] = useState<any[]>([]);
    const [axes, setAxes] = useState<any[]>([]);
    const [allResponses, setAllResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { company, loading: authLoading, supabase } = useCompany();

    useEffect(() => {
        async function loadData() {
            if (!company) return;
            setLoading(true);

            const [deptRes, axisRes, respRes] = await Promise.all([
                supabase.from('departments').select('*').eq('company_id', company.id),
                supabase.from('kpi_axes').select('*').eq('company_id', company.id),
                supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', company.id)
            ]);

            setDepts(deptRes.data || []);
            setAxes(axisRes.data || []);
            setAllResponses(respRes.data || []);
            setLoading(false);
        }
        loadData();
    }, [company, supabase]);

    const tabs = useMemo(() => {
        const base = [{ id: "all", label: "全社" }];
        const deptTabs = depts.map(d => ({ id: `dept_${d.id}`, label: d.name }));
        const axisTabs = axes.map(a => ({ id: `axis_${a.id}`, label: a.name }));
        return [...base, ...deptTabs, ...axisTabs];
    }, [depts, axes]);

    const last6Months = useMemo(() => getLastNMonths(6), []);
    const monthLabels = useMemo(() => getMonthLabels(last6Months), [last6Months]);

    const currentData = useMemo(() => {
        let filtered = allResponses;
        let viewName = "全社";

        if (view.startsWith("dept_")) {
            const deptId = view.replace("dept_", "");
            const dept = depts.find(d => d.id === deptId);
            viewName = dept ? `${dept.name}` : "不明な部署";
            filtered = allResponses.filter(r => r.department_id === deptId);
        } else if (view.startsWith("axis_")) {
            const axisId = view.replace("axis_", "");
            const axis = axes.find(a => a.id === axisId);
            viewName = axis ? `${axis.name}` : "不明な軸項目";
            filtered = allResponses.filter(r => r.axis_id === axisId);
        }

        const latestMonth = last6Months[last6Months.length - 1];
        const prevMonth = last6Months[last6Months.length - 2];
        const latestAnswers = filtered
            .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
            .flatMap(r => r.survey_answers || []);

        // 設問ごとのスコアを order 順で取得（UUIDベースの question_id での絞り込みを廃止）
        // 1回答あたり11設問分の answers が並んでいる前提で、インデックス別に集計
        const qScores = questions.map((_, qi) => {
            const scoresForQ: number[] = [];
            filtered
                .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
                .forEach(r => {
                    const ans = r.survey_answers || [];
                    if (ans[qi]) scoresForQ.push(ans[qi].score);
                });
            if (scoresForQ.length === 0) return 0;
            return scoresForQ.reduce((sum: number, s: number) => sum + s, 0) / scoresForQ.length;
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
            return scoresForQ.reduce((sum: number, s: number) => sum + s, 0) / scoresForQ.length;
        });

        const avgPulse = latestAnswers.length > 0
            ? latestAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / latestAnswers.length
            : 0;

        // 過去6ヶ月の推移を計算
        const pulseHistory = last6Months.map(month => {
            const monthAnswers = filtered
                .filter(r => normalizeMonth(r.recorded_month) === month)
                .flatMap(r => r.survey_answers || []);
            if (monthAnswers.length === 0) return 0;
            return monthAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / monthAnswers.length;
        });

        // 簡易AIコメント生成
        let comment = "回答データがまだ蓄積されていません。現場の声を集めることから始めましょう。";
        if (filtered.length > 0) {
            const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s > 0 && x.s < 3.0).sort((a, b) => a.s - b.s)[0];
            if (lowScoreQ) {
                comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。現場では心理的安全性やリソースの不足を感じている可能性があります。早急なヒアリングを推奨します。`;
            } else {
                comment = "全体的に良好な体温が維持されています。現在のポジティブなサイクルを維持しつつ、さらなる挑戦を促す環境を整えていきましょう。";
            }
        }

        const totalResponses = filtered.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

        return {
            viewName,
            scores: qScores,
            prevScores: prevQScores,
            pulse: avgPulse,
            pulseHistory: pulseHistory,
            aiComment: comment,
            totalResponses
        };
    }, [view, allResponses, depts, axes, last6Months]);

    if (authLoading || loading) {
        return <Loading fullScreen message="データを集計しています..." />;
    }

    if (!company) {
        return null; // useCompany側でリダイレクトされる
    }

    const monthPulseData = currentData.pulseHistory;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Header />

            <main className="max-w-3xl mx-auto px-5 py-8 space-y-10">

                {/* Navigation Back */}
                <div className="flex items-center justify-between">
                    <Link href="/" className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-teal transition-colors">
                        <span className="text-sm">←</span> DASHBOARD
                    </Link>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-500 border-none font-black text-[10px]">SURVEY ANALYSIS</Badge>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">組織の体温</h1>
                            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-[0.1em]">11の問いから紐解く現場の真実</p>
                        </div>
                    </div>
                    <TabBar
                        tabs={tabs}
                        active={view}
                        onChange={setView}
                    />
                </div>

                {/* Pulse History Chart */}
                {/* Main Content Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Badge className="bg-teal-500 text-white border-none mb-3 px-3 py-1 text-[10px]">
                                Monthly Insight
                            </Badge>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                                {currentData.viewName}
                            </h1>
                            <p className="text-sm text-slate-400 font-medium mt-1">熱量と組織コンディションの分析</p>
                        </div>
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Pulse</p>
                                <p className="text-3xl font-black text-slate-800 leading-none">{currentData.pulse.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="lg:col-span-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-teal">AI</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AI要約・示唆</h4>
                                    <p className="text-sm text-slate-700 font-bold leading-relaxed italic">
                                        &ldquo;{currentData.aiComment}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">
                            {currentData.viewName} の熱量
                            <span className="ml-2 text-sm font-medium text-slate-400">
                                (回答数: {currentData.totalResponses}件)
                            </span>
                        </h2>
                    </div>

                    {currentData.totalResponses === 0 ? (
                        <EmptyState
                            title="回答データがまだありません"
                            description="今月のアンケート回答がまだ登録されていないか、選択した条件に一致するデータがありません。"
                            actionLabel="アンケートに回答する"
                            actionHref="/form"
                            icon={<FileQuestion className="w-12 h-12 text-slate-200" />}
                        />
                    ) : (
                        <div className="space-y-6">
                            <div className="mb-2">
                                <h3 className="text-sm font-bold text-slate-800">組織の熱量推移 (Pulse)</h3>
                            </div>
                            <DetailLineChart
                                data={monthPulseData}
                                labels={monthLabels}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {questions.map((q, i) => (
                                    <SurveyQuestionCard
                                        key={q.id}
                                        question={q.text}
                                        score={currentData.scores[i]}
                                        prevScore={currentData.prevScores[i]}
                                        hint={q.hint || ""}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="pt-10 text-center space-y-4">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        Signs AI | Monthly Organizational Temperature Check
                    </p>
                </div>
            </main>
        </div>
    );
}
