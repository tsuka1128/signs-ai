"use client";

import { cn } from "@/lib/utils";
import { TabBar } from "@/components/ui/TabBar";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { SurveyHistoryData } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileQuestion } from "lucide-react";

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
}: SurveySectionProps) {
    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            組織の体温
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.1em]">11の問いから紐解く現場の真実</p>
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
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">現在の回答率</span>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-3xl font-black tabular-nums tracking-tighter",
                                    data.responseRate >= 80 ? "text-teal" : data.responseRate >= 40 ? "text-indigo-400" : "text-rose-500"
                                )}>
                                    {data.responseRate}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tabular-nums">({data.responseCount}名回答済)</span>
                            </div>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        data.responseRate >= 80 ? "bg-teal" : data.responseRate >= 40 ? "bg-indigo-400" : "bg-rose-500"
                                    )}
                                    style={{ width: `${data.responseRate}%` }}
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
                    </div>

                    {/* Pulse History Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">組織体温の推移</h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                    継続的なストレスや熱量の変化をモニタリング
                                </p>
                            </div>
                        </div>

                        <div className="h-40 w-full pt-4">
                            <DetailLineChart
                                data={data.pulseHistory}
                                labels={monthLabels}
                                color={data.pulse >= 3.5 ? "#10B981" : data.pulse >= 2.5 ? "#F59E0B" : "#EF4444"}
                                height={140}
                            />
                        </div>
                    </div>

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
                        </div>
                    </div>

                    {/* Question Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">設問別スコア詳細</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questions.map((q, i) => (
                                <SurveyQuestionCard
                                    key={q.id}
                                    question={q.text}
                                    hint={q.hint}
                                    score={data.scores[i]}
                                    prevScore={data.prevScores[i]}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
