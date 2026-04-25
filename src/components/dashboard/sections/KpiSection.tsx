"use client";

import { cn } from "@/lib/utils/index";
import { Badge } from "@/components/ui/Badge";
import { KpiSummaryCard } from "@/components/dashboard/KpiSummaryCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { KpiDisplayData } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";
import { HelpLink } from "@/components/ui/HelpLink";

interface KpiSectionProps {
    displayKpis: KpiDisplayData[];
    selKpi: string;
    setSelKpi: (id: string) => void;
    selectedKpiDef: KpiDisplayData | undefined;
    achRate: number | null;
    monthLabels: string[];
    fullMonthLabels: string[];
}

export function KpiSection({
    displayKpis,
    selKpi,
    setSelKpi,
    selectedKpiDef,
    achRate,
    monthLabels,
    fullMonthLabels,
}: KpiSectionProps) {
    return (
        <div className="space-y-4">
            {displayKpis.length > 0 ? (
                <>
                    {/* KPI Summary Row */}
                    <div className="flex gap-2 overflow-x-auto pt-2 pb-2 mt-[-8px] scrollbar-hide">
                        {displayKpis.map(k => (
                            <KpiSummaryCard
                                key={k.id}
                                name={k.name}
                                value={Number(k.val || 0).toLocaleString()}
                                unit={k.unit}
                                isActive={selKpi === k.id}
                                onClick={() => setSelKpi(k.id)}
                            />
                        ))}
                    </div>

                    {/* Major Detail Block */}
                    {selectedKpiDef && (
                        <>
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-slate-800">{selectedKpiDef.name}</h3>
                                            <HelpLink href="/docs/kpi-setup" label="KPI設定・入力ガイド" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge className="bg-slate-100 text-slate-500 font-bold border-none">担当: {selectedKpiDef.dept}</Badge>
                                            {selectedKpiDef.target && (
                                                <span className="text-xs text-slate-400 font-bold">目標: {Number(selectedKpiDef.target || 0).toLocaleString()}{selectedKpiDef.unit}</span>
                                            )}
                                            {achRate !== null && (
                                                <Badge className={cn(
                                                    "border-none font-black",
                                                    achRate >= 100 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                                                )}>
                                                    達成率 {achRate}%
                                                </Badge>
                                            )}
                                            {selectedKpiDef.yoy !== null && (
                                                <span className="text-[10px] text-slate-400 font-bold ml-1">
                                                    昨年同月対比 <span className={cn(selectedKpiDef.yoy >= 100 ? "text-emerald-500" : "text-rose-400")}>{selectedKpiDef.yoy}%</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1.5 justify-end">
                                            <span className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{Number(selectedKpiDef?.val || 0).toLocaleString()}</span>
                                            <span className="text-lg font-bold text-slate-400">{selectedKpiDef?.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">1年推移</div>
                                    <div className="h-40 w-full">
                                        <DetailLineChart
                                            data={selectedKpiDef.prev || []}
                                            targetData={selectedKpiDef.targetHistory || []}
                                            labels={monthLabels}
                                            fullLabels={fullMonthLabels}
                                            unit={selectedKpiDef.unit}
                                            color={(selectedKpiDef.prev && selectedKpiDef.prev.length >= 12 && selectedKpiDef.prev[11] >= (selectedKpiDef.prev[10] ?? 0)) ? "#10B981" : "#EF4444"}
                                        />
                                    </div>
                                </div>

                                {achRate !== null && (
                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">目標進捗</span>
                                            <span className={achRate >= 100 ? "text-emerald-500" : "text-rose-500"}>{achRate}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    achRate >= 100 ? "bg-emerald-400" : "bg-rose-400"
                                                )}
                                                style={{ width: `${Math.min(achRate, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Voices Details */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🗣️</span>
                                    <h4 className="text-base font-bold text-slate-800">{selectedKpiDef.dept}の匿名アンケート要約</h4>
                                    <Badge className="bg-slate-50 text-slate-400 border-none ml-2 tracking-tighter text-[10px] uppercase font-bold">{selectedKpiDef.name}に関する声</Badge>
                                </div>
                                <div className="space-y-3">
                                    {selectedKpiDef.voices && selectedKpiDef.voices.length > 0 ? (
                                        selectedKpiDef.voices.map((v: any, i: number) => {
                                            const moodColor = v.mood === "sun" ? "bg-emerald-50/50 border-emerald-100" : v.mood === "rain" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100";
                                            return (
                                                <div key={i} className={`p-5 rounded-2xl border flex gap-4 transition-all hover:translate-x-1 ${moodColor}`}>
                                                    <span className="text-xl shrink-0">{v.mood === "sun" ? "☀️" : v.mood === "cloud" ? "☁️" : "☔️"}</span>
                                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{v.text}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center py-10 text-slate-400 text-sm italic">このKPIに関連するボイスはまだありません。</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <EmptyState
                    title="KPIデータが登録されていません"
                    description="重要指標(KPI)を登録することで、組織の熱量データと売上等のパフォーマンスの相関を分析できるようになります。"
                    actionLabel="KPIを設定する"
                    actionHref="/onboarding"
                    icon={<BarChart3 className="w-12 h-12 text-slate-200" />}
                />
            )}
        </div>
    );
}
