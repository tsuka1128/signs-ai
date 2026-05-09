"use client";

import { cn } from "@/lib/utils/index";
import { TabBar } from "@/components/ui/TabBar";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { SurveyHistoryData } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { FileQuestion, Lock, MessageCircle, TrendingUp, TrendingDown, MinusCircle, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { LagCorrelationChart } from "@/components/dashboard/LagCorrelationChart";

import { useState } from "react";

interface SurveySectionProps {
    data: SurveyHistoryData;
    secondaryAxisName: string;
    matView: string;
    setMatView: (view: string) => void;
    realDepts: any[];
    realAxes: any[];
    orgView: string;
    setOrgView: (id: any) => void;
    monthLabels: string[];
    questions: any[];
    customQuestions: any[];
    displayDepts: any[];
}

export function SurveySection({
    data,
    secondaryAxisName,
    matView,
    setMatView,
    realDepts,
    realAxes,
    orgView,
    setOrgView,
    monthLabels,
    questions,
    customQuestions,
    displayDepts,
}: SurveySectionProps) {
    const [chartMode, setChartMode] = useState<'pulse' | 'deviation'>('pulse');
    const [lag, setLag] = useState(1);
    const [feedbackSent, setFeedbackSent] = useState<'accurate' | 'inaccurate' | null>(null);

    const handleFeedback = async (type: 'accurate' | 'inaccurate') => {
        setFeedbackSent(type);
        await fetch('/api/ai/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_month: data.dataMonth || new Date().toISOString().slice(0, 7),
                target_field: 'aiComment',
                feedback_type: type,
            }),
        });
    };
    const surveyViewId = (orgView === "product" || orgView === "dept" || orgView === "all") ? "all" : orgView;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            組織の体温
                            {data.isStale && data.dataMonth && (
                                <Badge className="border border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1">
                                    📅 {data.dataMonth}参照
                                </Badge>
                            )}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.1em]">{questions.length + customQuestions.length}の問いから紐解く現場の真実</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <TabBar
                        tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
                        active={matView}
                        onChange={setMatView}
                        className="w-fit"
                    />
                    <TabBar
                        tabs={[
                            { id: "all", label: "全社" },
                            ...(matView === "dept"
                                ? realDepts.map(d => ({ id: d.id, label: d.name }))
                                : realAxes.map(a => ({ id: a.id, label: a.name })))
                        ]}
                        active={orgView === "product" || orgView === "dept" ? "all" : orgView}
                        onChange={(id) => setOrgView(id as any)}
                    />
                </div>
            </div>

            {data.pulse === 0 ? (
                <EmptyState
                    title="アンケートデータがありません"
                    description="現場の熱量を可視化するために、まずはアンケートに回答してみましょう。数分で完了します。"
                    actionLabel="アンケートに回答する"
                    actionHref="/form"
                    icon={<FileQuestion className="w-12 h-12 text-slate-200" />}
                />
            ) : (
                <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">現在の回答率</span>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl font-black tabular-nums tracking-tighter",
                                (data as any).responseRate >= 80 ? "text-teal" : (data as any).responseRate >= 40 ? "text-indigo-400" : "text-rose-500"
                            )}>
                                {(data as any).responseRate}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tabular-nums">({(data as any).responseCount}名回答済)</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    (data as any).responseRate >= 80 ? "bg-teal" : (data as any).responseRate >= 40 ? "bg-indigo-400" : "bg-rose-500"
                                )}
                                style={{ width: `${(data as any).responseRate}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">当月平均体温</span>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl font-black tabular-nums tracking-tighter",
                                data.pulse >= 3.5 ? "text-emerald-500" : data.pulse >= 2.5 ? "text-amber-500" : "text-rose-500"
                            )}>
                                {data.pulse.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">/ 5.0</span>
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400 font-bold leading-tight">
                            {data.pulse >= 3.5 ? "非常に良好なコンディションです。" : data.pulse >= 2.5 ? "一部に課題が見られます。" : "早急な対話と対策が必要です。"}
                        </p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hidden md:block">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">全社偏差値</span>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl font-black tabular-nums tracking-tighter",
                                (data as any).deviation >= 55 ? "text-blue-500" : (data as any).deviation >= 45 ? "text-slate-600" : "text-rose-500"
                            )}>
                                {(data as any).deviation?.toFixed(1) || '50.0'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">/ 100</span>
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400 font-bold leading-tight">
                            {(data as any).deviation >= 55 ? "全社平均を上回る高水準です。" : (data as any).deviation >= 45 ? "全社平均並みの水準です。" : "全社平均を下回る傾向にあります。"}
                        </p>
                    </div>
                </div>

                    {/* Pulse History Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                    組織体温の推移
                                    <span className="text-xs font-bold text-slate-400 ml-2">({chartMode === 'pulse' ? 'スコア' : '全社偏差値'})</span>
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                    継続的なストレスや熱量の変化をモニタリング
                                </p>
                            </div>
                            
                            {surveyViewId !== "all" && (
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    <button
                                        onClick={() => setChartMode('pulse')}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                            chartMode === 'pulse' ? "bg-white text-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        スコア
                                    </button>
                                    <button
                                        onClick={() => setChartMode('deviation')}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                            chartMode === 'deviation' ? "bg-white text-blue-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        偏差値
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-40 w-full pt-4">
                            <DetailLineChart
                                data={chartMode === 'pulse' ? data.pulseHistory : (data as any).deviationHistory}
                                labels={monthLabels}
                                color={chartMode === 'pulse' 
                                    ? (data.pulse >= 3.5 ? "#10B981" : data.pulse >= 2.5 ? "#F59E0B" : "#EF4444")
                                    : "#3B82F6"
                                }
                                targetData={chartMode === 'deviation' ? Array(monthLabels.length).fill(50) : undefined}
                                height={140}
                            />
                        </div>
                    </div>

                    {/* 時間ラグ相関チャート */}
                    {displayDepts.length >= 1 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                        体温の「先行指標」としての効果
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                        今月の体温は、将来のKPIを予測するか？
                                    </p>
                                </div>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    <button
                                        onClick={() => setLag(1)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                            lag === 1 ? "bg-white text-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >1ヶ月後</button>
                                    <button
                                        onClick={() => setLag(2)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                            lag === 2 ? "bg-white text-teal shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >2ヶ月後</button>
                                </div>
                            </div>
                            <LagCorrelationChart depts={displayDepts} lag={lag} />
                        </div>
                    )}

                    {/* AI Analysis Card */}
                    <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="relative space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center shadow-inner shadow-teal/5"></div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">AI組織分析レポート</h3>
                                    <p className="text-[10px] text-teal font-black uppercase tracking-widest">{data.viewName}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {data.aiComment}
                                </p>
                            </div>
                            
                            {/* フィードバック */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span className="text-[10px] text-slate-400 font-bold">この分析は参考になりましたか？</span>
                                {feedbackSent ? (
                                    <span className="text-[10px] font-black text-teal">フィードバックを送信しました ✓</span>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleFeedback('accurate')}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 transition-all"
                                        >
                                            <ThumbsUp className="w-3 h-3" /> 参考になった
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('inaccurate')}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 border border-slate-100 transition-all"
                                        >
                                            <ThumbsDown className="w-3 h-3" /> 改善が必要
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {customQuestions.length > 0 && (
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        オリジナル設問
                                    </h3>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        Custom
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {customQuestions.map((q, i) => (
                                        <SurveyQuestionCard
                                            key={q.id}
                                            question={q.text}
                                            hint={q.hint}
                                            score={data.customScores?.[i] ?? 0}
                                            prevScore={0}
                                            deviationDiff={undefined}
                                            allOrgsScores={undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Voices (Abstracted Qualitative Comments) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-slate-300" />
                                現場の声（AI分析）
                            </h3>
                            {data.responseCount >= 3 && (
                                <Badge className="bg-teal/10 text-teal font-black text-[9px] border-none px-2 uppercase tracking-widest">
                                    {data.voiceTopics?.length || 0} Topics Extracted
                                </Badge>
                            )}
                        </div>

                        {data.responseCount < 3 ? (
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Lock className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 mb-1">生データの閲覧が制限されています</p>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                                        個人の特定を防ぐ（心理的安全性を担保する）ため、対象グループの回答者が <b>3名以上</b> になるまで定性コメントおよびトピック抽出は表示されません。<br />
                                        現在の回答者：<span className="font-black text-rose-500">{data.responseCount} 名</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.voiceTopics?.map((v, i) => (
                                    <div key={v.id || i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-all">
                                        <div className={cn(
                                            "absolute top-0 left-0 w-1 h-full",
                                            v.sentiment === 'positive' ? "bg-emerald-400" :
                                            v.sentiment === 'negative' ? "bg-rose-400" : "bg-slate-300"
                                        )} />
                                        <div className="flex items-start justify-between mb-3 pl-3">
                                            <div className="flex items-center gap-2">
                                                {v.sentiment === 'positive' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                                                 v.sentiment === 'negative' ? <TrendingDown className="w-4 h-4 text-rose-500" /> :
                                                 <MinusCircle className="w-4 h-4 text-slate-400" />}
                                                <span className="text-xs font-black text-slate-700">{v.topic}</span>
                                            </div>
                                            {v.persona && (
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {v.persona} の傾向
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl p-4 ml-3 border border-slate-50 relative">
                                            <div className="absolute -top-2 left-4 px-2 bg-slate-50">
                                                <Sparkles className="w-3 h-3 text-amber-400" />
                                            </div>
                                            <p className="text-[11px] text-slate-600 font-bold leading-relaxed tracking-wide">
                                                {v.abstractedVoice}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!data.voiceTopics || data.voiceTopics.length === 0) && (
                                    <div className="col-span-1 md:col-span-2 text-center py-8">
                                        <p className="text-[11px] font-black text-slate-400 tracking-widest text-center">トピックを抽出中です...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Question Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">設問別スコア詳細</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questions.map((q, i) => {
                                const questionDev = (data as any).questionDeviations?.[i];
                                const devDiff = questionDev !== undefined ? questionDev - 50 : undefined;
                                const allOrgsScores = (data as any).allOrgsStats?.orgScores?.map((o: any) => o.qScores[i]);

                                return (
                                    <SurveyQuestionCard
                                        key={q.id}
                                        question={q.text}
                                        hint={q.hint}
                                        score={data.scores[i]}
                                        prevScore={data.prevScores[i]}
                                        deviationDiff={devDiff}
                                        allOrgsScores={allOrgsScores}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
