"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { KpiSummaryCard } from "@/components/dashboard/KpiSummaryCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { KpiDisplayData } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { HelpLink } from "@/components/ui/HelpLink";
import { cn } from "@/lib/utils/index";
import {
  calcKpiQuality, KPI_QUALITY_META, KpiQuality,
  calcKpiSetHealth, KPI_SET_HEALTH_META,
} from "@/lib/logic/kpi-engine";

interface KpiSectionProps {
    displayKpis: KpiDisplayData[];
    selKpi: string;
    setSelKpi: (id: string) => void;
    selectedKpiDef: any;
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
        <div className="space-y-8">
            {displayKpis.length > 0 ? (
                <>
                    {/* KPI Summary Row */}
                    <div className="flex gap-2 overflow-x-auto pt-2 pb-2 mt-[-8px] scrollbar-hide">
                        {displayKpis.map(k => (
                            <div key={k.id} className="flex-shrink-0">
                                <KpiSummaryCard
                                    name={k.name}
                                    value={String(k.val)}
                                    unit={k.unit}
                                    isActive={selKpi === k.id}
                                    onClick={() => setSelKpi(k.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {selectedKpiDef && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                            {/* Detailed Chart & Stats (Full Width) */}
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-8 pb-4 border-b border-slate-50 bg-slate-50/20">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className="bg-slate-100 text-slate-500 border-none font-bold uppercase tracking-widest text-[9px] px-2">{selectedKpiDef.dept}</Badge>
                                                {achRate !== null && (
                                                    <Badge className={cn(
                                                        "border-none font-black text-[9px] px-2",
                                                        achRate >= 100 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                                                    )}>
                                                        達成率 {achRate}%
                                                    </Badge>
                                                )}
                                                {selectedKpiDef.yoy !== null && (
                                                    <span className="text-[10px] text-slate-400 font-bold ml-1">
                                                        前年同月比 <span className={cn(selectedKpiDef.yoy >= 100 ? "text-emerald-500" : "text-rose-400")}>{selectedKpiDef.yoy}%</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedKpiDef.name}</h3>
                                                <HelpLink href="/docs/kpi-setup" label="KPI設定・入力ガイド" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-1.5 justify-end">
                                                <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{Number(selectedKpiDef?.val || 0).toLocaleString()}</span>
                                                <span className="text-lg font-bold text-slate-400">{selectedKpiDef?.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pb-16 flex-1 flex flex-col justify-center min-h-[300px]">
                                    <div className="h-[200px] w-full">
                                        <DetailLineChart
                                            data={selectedKpiDef.prev || []}
                                            targetData={selectedKpiDef.targetHistory || []}
                                            labels={monthLabels}
                                            fullLabels={fullMonthLabels}
                                            unit={selectedKpiDef.unit}
                                            color={(selectedKpiDef.prev && selectedKpiDef.prev.length >= 12 && selectedKpiDef.prev[11] >= (selectedKpiDef.prev[10] ?? 0)) ? "#14b8a6" : "#f43f5e"}
                                            pulseHistory={(() => {
                                                const dept = displayDepts.find(d => d.name === selectedKpiDef.dept);
                                                return dept?.pulseHistory || [];
                                            })()}
                                        />
                                    </div>
                                </div>

                                {achRate !== null && (
                                    <div className="p-8 pt-6 border-t border-slate-50 bg-slate-50/10">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-400">最新月目標進捗</span>
                                            <span className={achRate >= 100 ? "text-emerald-500" : "text-rose-500"}>{achRate}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    achRate >= 100 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]"
                                                )}
                                                style={{ width: `${Math.min(achRate, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Voices Details (Full Width below chart) */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-teal/5 flex items-center justify-center">
                                            <span className="text-xl">🗣️</span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-800 tracking-tight">{selectedKpiDef.dept}の声</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee Voices Summary</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-slate-50 text-slate-400 border-none tracking-widest text-[9px] uppercase font-black px-3 py-1">匿名アンケート</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedKpiDef.voices && selectedKpiDef.voices.length > 0 ? (
                                        selectedKpiDef.voices.map((v: any, i: number) => {
                                            const moodColor = v.mood === "sun" ? "bg-emerald-50/50 border-emerald-100" : v.mood === "rain" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100";
                                            return (
                                                <div key={i} className={`p-5 rounded-2xl border flex gap-4 transition-all hover:bg-white hover:shadow-md ${moodColor}`}>
                                                    <span className="text-xl shrink-0">{v.mood === "sun" ? "☀️" : v.mood === "cloud" ? "☁️" : "☔️"}</span>
                                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{v.text}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-40">
                                            <BarChart3 className="w-12 h-12 text-slate-200 mb-4" />
                                            <p className="text-sm text-slate-400 italic font-medium">このKPIに関連するボイスはまだありません。</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 部署別 KPI コンディション診断テーブル */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                        <div className="px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30 rounded-t-[32px]">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-slate-400" />
                                部署別 KPI コンディション診断
                            </h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3">
                                    {[
                                        { key: "healthy", label: "健全", dot: "bg-emerald-500" },
                                        { key: "burnout", label: "焼き付き", dot: "bg-amber-500" },
                                        { key: "structural", label: "構造課題", dot: "bg-rose-500" },
                                        { key: "potential", label: "余力あり", dot: "bg-sky-500" },
                                    ].map(g => (
                                        <div key={g.key} className="flex items-center gap-1.5 group/g relative">
                                            <div className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-help">{g.label}</span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/g:block z-[100] leading-relaxed font-medium animate-in fade-in zoom-in-95">
                                                <div className="font-black mb-1 border-b border-slate-700 pb-1">{g.label}</div>
                                                {KPI_QUALITY_META[g.key as KpiQuality].description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden sm:block w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Analysis View</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="overflow-x-auto sm:overflow-visible">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">部署</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">担当KPI</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">達成率</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">体温</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">コンディション診断</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <span>目標設定の評価</span>
                                                <div className="relative group/sethelp">
                                                    <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors select-none">?</button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/sethelp:block z-[60] leading-relaxed font-medium animate-in fade-in zoom-in-95 whitespace-normal normal-case tracking-normal">
                                                        <div className="font-black text-white mb-2 border-b border-slate-700 pb-1.5">目標設定の健全性</div>
                                                        <p className="text-slate-300 mb-2">過去13ヶ月のKPI達成率の平均から、目標値の難易度が適切かを自動判定します。</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-violet-400 font-black shrink-0">⚑ 低すぎる可能性</span>
                                                                <span className="text-slate-400">平均達成率が115%超。目標がチャレンジングでない可能性。</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-rose-400 font-black shrink-0">⚑ 高すぎる可能性</span>
                                                                <span className="text-slate-400">平均達成率が65%未満。体温への影響も要確認。</span>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-slate-400 font-black shrink-0">適正</span>
                                                                <span className="text-slate-400">達成率が適切な範囲（65〜115%）で推移。</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayDepts.map((d: any) => {
                                        const quality = calcKpiQuality(d.kpiAch || 0, d.pulse || 0);
                                        const qMeta = KPI_QUALITY_META[quality];
                                        const setHealth = calcKpiSetHealth(d.kpiAchHistory ?? []);
                                        const shMeta = KPI_SET_HEALTH_META[setHealth];
                                        
                                        const deptKpi = displayKpis.find(k => k.dept === d.name);

                                        return (
                                            <tr key={d.id} className="group hover:bg-slate-50/30 transition-colors border-b border-slate-50/50">
                                                <td className="py-5 px-8">
                                                    <span className="text-sm font-black text-slate-700">{d.name}</span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className="text-[11px] font-black text-slate-400 bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-200/50">{deptKpi?.name || "---"}</span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className={cn(
                                                        "text-sm font-black tabular-nums tracking-tighter",
                                                        (d.kpiAch || 0) >= 100 ? "text-emerald-500" : (d.kpiAch || 0) >= 80 ? "text-slate-700" : "text-rose-500"
                                                    )}>
                                                        {d.kpiAch || 0}%
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className={cn(
                                                        "text-xs font-black px-2.5 py-1 rounded-lg shadow-sm",
                                                        (d.pulse || 0) >= 3.8 ? "bg-emerald-50 text-emerald-600" : (d.pulse || 0) >= 3.0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {d.pulse || 0}
                                                    </span>
                                                </td>

                                                {/* コンディション診断 */}
                                                <td className="py-5 px-4">
                                                    <div className="relative group/quality inline-block">
                                                        <span className={`text-[11px] font-black px-3.5 py-1.5 rounded-full cursor-help shadow-sm border border-white ${qMeta.bg} ${qMeta.color}`}>
                                                            {qMeta.icon} {qMeta.label}
                                                        </span>
                                                        <div className="absolute bottom-full left-0 mb-3 w-64 p-5 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/quality:block z-[60] leading-relaxed font-medium animate-in fade-in zoom-in-95">
                                                            <div className="font-black mb-1.5 border-b border-slate-700 pb-1.5 flex items-center gap-2">
                                                                <span>{qMeta.icon}</span>
                                                                <span>{qMeta.label}</span>
                                                            </div>
                                                            {qMeta.description}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 設定健全性 */}
                                                <td className="py-5 px-4">
                                                    {setHealth !== "optimal" ? (
                                                        <div className="relative group/sethealth inline-block">
                                                            <span className={`text-[11px] font-black cursor-help flex items-center gap-1.5 ${shMeta.color}`}>
                                                                <span className="text-base">⚑</span> {shMeta.label}
                                                            </span>
                                                            <div className="absolute bottom-full left-0 mb-3 w-64 p-5 bg-slate-800 text-white text-[11px] rounded-2xl shadow-2xl hidden group-hover/sethealth:block z-[60] leading-relaxed font-medium animate-in fade-in zoom-in-95">
                                                                <div className="font-black mb-1.5 border-b border-slate-700 pb-1.5 flex items-center gap-2">
                                                                    <span>⚑</span>
                                                                    <span>{shMeta.label}</span>
                                                                </div>
                                                                {shMeta.description}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300">適正</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>

                    {/* 部署別KPI達成率 月次推移 */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30 rounded-t-[32px]">
                            <TrendingUp className="w-4 h-4 text-teal/60" />
                            <h3 className="text-sm font-black text-slate-800 tracking-tight">部署別KPI達成率 月次推移</h3>
                            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Past 13 Months</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="sticky left-0 z-10 bg-slate-50 py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[140px]">部署</th>
                                        {fullMonthLabels.map((label, i) => (
                                            <th key={i} className={cn(
                                                "py-4 px-3 text-[10px] font-black text-center border-b border-slate-100 whitespace-nowrap min-w-[72px]",
                                                i === fullMonthLabels.length - 1 ? "text-teal" : "text-slate-400"
                                            )}>{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayDepts.map((d: any) => (
                                        <tr key={d.id} className="border-b border-slate-50/50 hover:bg-slate-50/30 transition-colors">
                                            <td className="sticky left-0 z-10 bg-white/95 py-4 px-8">
                                                <span className="text-sm font-black text-slate-700">{d.name}</span>
                                            </td>
                                            {(d.kpiAchHistory as number[]).map((ach, i) => (
                                                <td key={i} className="py-4 px-3 text-center">
                                                    {ach > 0 ? (
                                                        <span className={cn(
                                                            "text-xs font-black tabular-nums px-2 py-0.5 rounded-lg",
                                                            ach >= 100
                                                                ? "bg-emerald-50 text-emerald-600"
                                                                : ach >= 80
                                                                ? "bg-amber-50 text-amber-600"
                                                                : "bg-rose-50 text-rose-500"
                                                        )}>
                                                            {ach}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-200 font-bold">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <EmptyState
                    title="表示可能なKPIデータがありません"
                    description="組織設定からKPIを定義し、実績データを入力してください。"
                    actionLabel="KPI設定を開く"
                    actionHref="/settings"
                    icon={<BarChart3 className="w-12 h-12 text-slate-200" />}
                />
            )}
        </div>
    );
}
