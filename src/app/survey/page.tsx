"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { TabBar } from "@/components/ui/TabBar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const questions = [
    { id: 1, text: "今の仕事にワクワクしていますか？", hint: "月曜の朝、布団の中で思い浮かべてみてください。" },
    { id: 2, text: "何かが決まるのを「待つ時間」は少なかったですか？", hint: "待っている間、あなたの熱量は少しずつ冷めていきます。" },
    { id: 3, text: "必要な情報が自分まで届いていましたか？", hint: "知らなかったことで、損をしていませんでしたか。" },
    { id: 4, text: "「調整」や「根回し」に時間を取られすぎていませんか？", hint: "本来、何に使いたかった時間ですか。" },
    { id: 5, text: "言いづらいことを飲み込まずに伝えられましたか？", hint: "飲み込んだ言葉は、どこかで体温を下げます。" },
    { id: 6, text: "「何を成すべきか」に迷わず集中できましたか？", hint: "迷いは、あなたのせいではないかもしれません。" },
    { id: 7, text: "上司や仲間から反応（賞賛や指摘）がありましたか？", hint: "無反応は、じわじわと人を蝕みます。" },
    { id: 8, text: "業務量は、質を維持できる範囲でしたか？", hint: "「頑張ればできる」は、長くは続きません。" },
    { id: 9, text: "「顧客のプラスになること」に時間を使えましたか？", hint: "社内都合に時間を奪われた日、悔しくなかったですか。" },
    { id: 10, text: "新しい工夫や挑戦ができましたか？", hint: "同じことの繰り返しは、安全に見えて危険です。" },
    { id: 11, text: "KPI達成に向けて、準備周到に活動できていますか？", hint: "道筋が見えているだけで、体温は上がります。" },
];

// モックデータ定数を削除し、状態管理に移行

export default function SurveyDashboard() {
    const supabase = createClient();
    const [view, setView] = useState("all");
    const [company, setCompany] = useState<any>(null);
    const [depts, setDepts] = useState<any[]>([]);
    const [axes, setAxes] = useState<any[]>([]);
    const [allResponses, setAllResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single();
            if (!userData) return;

            const [compRes, deptRes, axisRes, respRes] = await Promise.all([
                supabase.from('companies').select('*').eq('id', userData.company_id).single(),
                supabase.from('departments').select('*').eq('company_id', userData.company_id),
                supabase.from('kpi_axes').select('*').eq('company_id', userData.company_id),
                supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', userData.company_id)
            ]);

            setCompany(compRes.data);
            setDepts(deptRes.data || []);
            setAxes(axisRes.data || []);
            setAllResponses(respRes.data || []);
            setLoading(false);
        }
        loadData();
    }, [supabase]);

    const tabs = useMemo(() => {
        const base = [{ id: "all", label: "🏢 全社" }];
        const deptTabs = depts.map(d => ({ id: `dept_${d.id}`, label: `👥 ${d.name}` }));
        const axisTabs = axes.map(a => ({ id: `axis_${a.id}`, label: `🏷️ ${a.name}` }));
        return [...base, ...deptTabs, ...axisTabs];
    }, [depts, axes]);

    const currentData = useMemo(() => {
        let filtered = allResponses;
        if (view.startsWith("dept_")) {
            const deptId = view.replace("dept_", "");
            filtered = allResponses.filter(r => r.department_id === deptId);
        } else if (view.startsWith("axis_")) {
            const axisId = view.replace("axis_", "");
            filtered = allResponses.filter(r => r.axis_id === axisId);
        }

        const qScores = questions.map(q => {
            const answers = filtered.flatMap(r => r.survey_answers || []).filter(a => a.question_id === q.id);
            if (answers.length === 0) return 0;
            return answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
        });

        const avgPulse = qScores.length > 0 ? qScores.reduce((a, b) => a + b, 0) / qScores.length : 0;

        // 簡易AIコメント生成（スコアに基づいた動的生成）
        let comment = "回答データがまだ蓄積されていません。現場の声を集めることから始めましょう。";
        if (filtered.length > 0) {
            const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s < 3.0).sort((a, b) => a.s - b.s)[0];
            if (lowScoreQ) {
                comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。現場では心理的安全性やリソースの不足を感じている可能性があります。早急なヒアリングを推奨します。`;
            } else {
                comment = "全体的に良好な体温が維持されています。現在のポジティブなサイクルを維持しつつ、さらなる挑戦を促す環境を整えていきましょう。";
            }
        }

        return {
            scores: qScores,
            pulse: avgPulse,
            pulseHistory: [avgPulse * 0.9, avgPulse * 0.95, avgPulse * 1.05, avgPulse * 0.98, avgPulse * 1.02, avgPulse], // モック推移
            aiComment: comment
        };
    }, [view, allResponses]);

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
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">🌡️</span>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">組織体温の推移（直近6ヶ月）</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pl-8">
                                継続的なストレスや熱量の変化をモニタリング
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">当月平均</span>
                            <span className={cn(
                                "text-4xl font-black tabular-nums tracking-tighter",
                                currentData.pulse >= 3.5 ? "text-emerald-500" : currentData.pulse >= 2.5 ? "text-amber-500" : "text-rose-500"
                            )}>
                                {currentData.pulse.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <div className="h-40 w-full pt-4">
                        <DetailLineChart
                            data={currentData.pulseHistory}
                            labels={["9月", "10月", "11月", "12月", "1月", "2月"]}
                            color={currentData.pulse >= 3.5 ? "#10B981" : currentData.pulse >= 2.5 ? "#F59E0B" : "#EF4444"}
                            height={140}
                        />
                    </div>
                </div>

                {/* AI Analysis Card */}
                <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-xl shadow-inner shadow-teal/5">🧠</div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">AI組織分析レポート</h3>
                                <p className="text-[10px] text-teal font-black uppercase tracking-widest">{view === "all" ? "Whole Company" : `${view.toUpperCase()} DEPARTMENT`}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {currentData.aiComment}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-tighter uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                            Data sufficiency: {allResponses.length > 0 ? "Satisfactory" : "Insufficient"}
                        </div>
                    </div>
                </div>

                {/* Question Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">設問別スコア詳細</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Good</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Warning</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Critical</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map((q, i) => {
                            const prevScore = currentData.scores[i] * 0.95; // Math.randomを排除して固定の係数（モック）に
                            return (
                                <SurveyQuestionCard
                                    key={q.id}
                                    question={q.text}
                                    hint={q.hint}
                                    score={currentData.scores[i]}
                                    prevScore={prevScore}
                                />
                            );
                        })}
                    </div>
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
