"use client";

import { cn } from "@/lib/utils/index";
import { Badge } from "@/components/ui/Badge";
import { KpiSummaryCard } from "@/components/dashboard/KpiSummaryCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { KpiDisplayData } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, TrendingDown } from "lucide-react";
import { HelpLink } from "@/components/ui/HelpLink";
import {
  calcKpiQuality, KPI_QUALITY_META,
  calcKpiSetHealth, KPI_SET_HEALTH_META,
} from "@/lib/logic/kpi-engine";

interface KpiSectionProps {
    displayKpis: KpiDisplayData[];
    selKpi: string;
    setSelKpi: (id: string) => void;
    selectedKpiDef: KpiDisplayData | undefined;
    achRate: number | null;
    monthLabels: string[];
    fullMonthLabels: string[];
    displayDepts: any[];
}

export function KpiSection({
    displayKpis,
    selKpi,
    setSelKpi,
    selectedKpiDef,
    achRate,
    monthLabels,
    fullMonthLabels,
    displayDepts,
}: KpiSectionProps) {
    return (
        <div className="space-y-6">
            {displayKpis.length > 0 ? (
                <>
                    {/* 全社サマリーバッジ（セクションの最上部に追加） */}
                    {(() => {
                        const counts = { healthy: 0, burnout: 0, structural: 0, potential: 0 };
                        displayDepts.forEach((d: any) => {
                            const q = calcKpiQuality(d.kpiAch || 0, d.pulse || 0);
                            counts[q]++;
                        });
                        const items = [
                            { key: "healthy", label: "健全達成", color: "bg-emerald-100 text-emerald-700" },
                            { key: "burnout", label: "焼き付き", color: "bg-amber-100  text-amber-700" },
                            { key: "structural", label: "構造課題", color: "bg-rose-100   text-rose-700" },
                            { key: "potential", label: "余力あり", color: "bg-sky-100    text-sky-700" },
                        ] as const;
                        return (
                            <div className="flex flex-wrap gap-2 mb-2 px-1">
                                {items.map(item => counts[item.key] > 0 && (
                                    <span key={item.key} className={`text-[11px] font-black px-3 py-1.5 rounded-full ${item.color} shadow-sm border border-white`}>
                                        {item.label} {counts[item.key]}部署
                                    </span>
                                ))}
                            </div>
                        );
                    })()}
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
                                            pulseHistory={(() => {
                                                const dept = displayDepts.find(d => d.name === selectedKpiDef.dept);
                                                return dept?.pulseHistory || [];
                                            })()}
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

                    {/* 達成の質・目標設定健全性一覧テーブル */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-slate-400" />
                                部署別 KPI 達成の質と設定健全性
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analysis View</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">部署</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">達成率</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">体温</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">達成の質</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">目標設定の評価</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayDepts.map((d: any) => {
                                        const quality = calcKpiQuality(d.kpiAch || 0, d.pulse || 0);
                                        const qMeta = KPI_QUALITY_META[quality];
                                        const setHealth = calcKpiSetHealth(d.kpiAchHistory ?? []);
                                        const shMeta = KPI_SET_HEALTH_META[setHealth];

                                        return (
                                            <tr key={d.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <td className="py-4 px-6">
                                                    <span className="text-sm font-bold text-slate-700">{d.name}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={cn(
                                                        "text-sm font-black tabular-nums",
                                                        (d.kpiAch || 0) >= 100 ? "text-emerald-500" : (d.kpiAch || 0) >= 80 ? "text-slate-700" : "text-rose-500"
                                                    )}>
                                                        {d.kpiAch || 0}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-0.5 rounded-lg",
                                                        (d.pulse || 0) >= 3.8 ? "bg-emerald-50 text-emerald-600" : (d.pulse || 0) >= 3.0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {d.pulse || 0}
                                                    </span>
                                                </td>

                                                {/* 達成の質 */}
                                                <td className="py-4 px-4">
                                                    <div className="relative group/quality inline-block">
                                                        <span className={`text-[11px] font-black px-3 py-1 rounded-full cursor-help shadow-sm border border-white ${qMeta.bg} ${qMeta.color}`}>
                                                            {qMeta.icon} {qMeta.label}
                                                        </span>
                                                        <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/quality:block z-[60] leading-relaxed font-medium animate-in fade-in zoom-in-95">
                                                            <div className="font-black mb-1 border-b border-slate-700 pb-1">{qMeta.label}</div>
                                                            {qMeta.description}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 設定健全性 */}
                                                <td className="py-4 px-4">
                                                    {setHealth !== "optimal" ? (
                                                        <div className="relative group/sethealth inline-block">
                                                            <span className={`text-[11px] font-black cursor-help flex items-center gap-1 ${shMeta.color}`}>
                                                                <span className="text-base">⚑</span> {shMeta.label}
                                                            </span>
                                                            <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/sethealth:block z-[60] leading-relaxed font-medium animate-in fade-in zoom-in-95">
                                                                <div className="font-black mb-1 border-b border-slate-700 pb-1">{shMeta.label}</div>
                                                                {shMeta.description}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300">適正範囲内</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
