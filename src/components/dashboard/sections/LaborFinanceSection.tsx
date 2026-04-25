"use client";

import { TrendingUp, PieChart, Info, ArrowUpRight, Target, Coins } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface LaborFinanceSectionProps {
    laborRoi: number;
    laborDistRate: number;
    totalLaborCost: number;
    deptFinanceData?: {
        id: string;
        name: string;
        laborCostPerHead: number;
        totalLaborCost: number;
        kpiAch: number;
        pulse: number;
    }[];
    avgLaborCostPerHead?: number;
    aiContent?: any;
}

const DEPT_COLORS = [
    "bg-teal-500", "bg-indigo-500", "bg-amber-500", "bg-rose-500",
    "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-orange-500",
    "bg-slate-400"
];

export function LaborFinanceSection({ 
    laborRoi, 
    laborDistRate, 
    totalLaborCost, 
    deptFinanceData = [], 
    avgLaborCostPerHead = 0,
    aiContent 
}: LaborFinanceSectionProps) {
    const hasDistRate = laborDistRate > 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ROI Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-teal" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal rounded-full text-[10px] font-black uppercase tracking-widest">
                            <ArrowUpRight className="w-3 h-3" />
                            Efficiency
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                            人件費ROI (投資対効果)
                            <div className="relative group/roi text-left">
                                <button className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-500 flex items-center justify-center text-[9px] font-black cursor-help transition-colors select-none">?</button>
                                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/roi:block z-[40] normal-case tracking-normal animate-in fade-in zoom-in-95 font-medium">
                                    <div className="font-bold text-white mb-2 flex items-center gap-1.5">計算式: 平均KPI達成率 ÷ (総人件費 / 100)</div>
                                    <div className="text-slate-300 italic mb-2">※ 総人件費は最新月（万円単位）</div>
                                    <div className="text-slate-200">
                                        投入したリソース（人件費）に対して、どれだけ効率的に目標達成（成果）を引き出せているかを測定するインデックス値です。
                                    </div>
                                </div>
                            </div>
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800 tracking-tighter">{laborRoi.toFixed(1)}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Index</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        全社のKPI達成状況を人件費の投下量で割った独自指標です。数値が高いほど、少ないリソースで高い成果を上げていることを示します。
                    </p>
                </div>

                {/* Distribution Rate Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <PieChart className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Target className="w-3 h-3" />
                            Structure
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                            労働分配率
                            <div className="relative group/dist text-left">
                                <button className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-500 flex items-center justify-center text-[9px] font-black cursor-help transition-colors select-none">?</button>
                                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/dist:block z-[40] normal-case tracking-normal animate-in fade-in zoom-in-95 font-medium">
                                    <div className="font-bold text-white mb-2 flex items-center gap-1.5">計算式: (総人件費 ÷ 売上KPI実績) × 100</div>
                                    <div className="text-slate-200">
                                        売上高のうち、どれだけが人件費として分配されているかを示す指標です。一般的に40~60%が適正と言われますが、ビジネスモデルにより異なります。
                                    </div>
                                </div>
                            </div>
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-4xl font-black tracking-tighter",
                                hasDistRate ? "text-slate-800" : "text-slate-300"
                            )}>
                                {hasDistRate ? laborDistRate : "--"}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">%</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        {hasDistRate 
                          ? "売上KPIに対する総人件費の比率です。一般的に40~60%が適正と言われますが、ビジネスモデルにより異なります。"
                          : "売上KPIの入力がないため算出できません。売上実績を入力すると、現在の人件費バランスを評価できます。"}
                    </p>
                </div>
            </div>
            
            {/* ❶ 部署別コスト効率ランキング & ❷ 構成比 */}
            {deptFinanceData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ranking Block */}
                    <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-teal" />
                                部署別コスト効率ランキング
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Ranking</span>
                        </div>
                        
                        <div className="space-y-5">
                            {deptFinanceData
                                .map(d => ({ ...d, efficiency: d.laborCostPerHead > 0 ? d.kpiAch / d.laborCostPerHead : 0 }))
                                .sort((a, b) => b.efficiency - a.efficiency)
                                .map((d, i) => {
                                    const isHighEfficiency = d.efficiency > 2; // Arbitrary threshold for demo visualization
                                    return (
                                        <div key={d.id} className="group cursor-default">
                                            <div className="flex justify-between items-end mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-300">#{i + 1}</span>
                                                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    単価:{d.laborCostPerHead}万 / 達成:{d.kpiAch}%
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden flex">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        d.kpiAch >= 100 ? "bg-teal-400" : d.kpiAch >= 80 ? "bg-amber-400" : "bg-rose-400"
                                                    )}
                                                    style={{ width: `${Math.min(100, (d.efficiency / 3) * 100)}%` }} // Normalized for visualization
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Composition Block */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-indigo-500" />
                                人件費構成比
                            </h3>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Stacked Vertical Bar */}
                            <div className="h-64 w-full bg-slate-50 rounded-2xl p-1.5 flex flex-col gap-1 overflow-hidden">
                                {deptFinanceData.map((d, i) => {
                                    const percent = totalLaborCost > 0 ? (d.totalLaborCost / totalLaborCost) * 100 : 0;
                                    if (percent < 1) return null;
                                    return (
                                        <div 
                                            key={d.id}
                                            className={cn("w-full rounded-lg relative group/item", DEPT_COLORS[i % DEPT_COLORS.length])}
                                            style={{ height: `${percent}%` }}
                                        >
                                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded hidden group-hover/item:block whitespace-nowrap z-30">
                                                {d.name}: {percent.toFixed(1)}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="space-y-2">
                                {deptFinanceData.slice(0, 5).map((d, i) => (
                                    <div key={d.id} className="flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", DEPT_COLORS[i % DEPT_COLORS.length])} />
                                            <span className="font-bold text-slate-600">{d.name}</span>
                                        </div>
                                        <span className="font-black text-slate-400 italic">{(totalLaborCost > 0 ? (d.totalLaborCost / totalLaborCost) * 100 : 0).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ❸ 体温 × コスト 4象限分析 */}
            {deptFinanceData.length > 0 && (
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Target className="w-5 h-5 text-teal" />
                                体温 × コスト 象限分析
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Organizational Health vs. Cost Baseline</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">全社単価平均</span>
                            <span className="text-xs font-black text-slate-700">{avgLaborCostPerHead.toLocaleString()}万円</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 rounded-3xl border border-slate-100 overflow-hidden shadow-inner">
                        {/* Quarter 1: High Pulse, Low Cost */}
                        <div className="bg-emerald-50/30 p-8 min-h-[160px] space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-widest bg-white">理想的</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">自律型高効率</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {deptFinanceData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead <= avgLaborCostPerHead).map(d => (
                                    <div key={d.id} className="px-3 py-1.5 bg-white border border-emerald-100 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Quarter 2: High Pulse, High Cost */}
                        <div className="bg-indigo-50/30 p-8 min-h-[160px] space-y-4 border-l border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-widest bg-white">安定投資</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">高稼働・厚待遇</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {deptFinanceData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead > avgLaborCostPerHead).map(d => (
                                    <div key={d.id} className="px-3 py-1.5 bg-white border border-indigo-100 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Quarter 3: Low Pulse, Low Cost */}
                        <div className="bg-amber-50/30 p-8 min-h-[160px] space-y-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-widest bg-white">要注意</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">投資不足リスク</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {deptFinanceData.filter(d => d.pulse < 3.0 && d.laborCostPerHead <= avgLaborCostPerHead).map(d => (
                                    <div key={d.id} className="px-3 py-1.5 bg-white border border-amber-100 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Quarter 4: Low Pulse, High Cost */}
                        <div className="bg-rose-50/30 p-8 min-h-[160px] space-y-4 border-t border-l border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full uppercase tracking-widest bg-white">警告域</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">構造的非能率</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {deptFinanceData.filter(d => d.pulse < 3.0 && d.laborCostPerHead > avgLaborCostPerHead).map(d => (
                                    <div key={d.id} className="px-3 py-1.5 bg-white border border-rose-100 text-slate-700 text-xs font-bold rounded-xl shadow-sm ring-1 ring-rose-100">
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Insight for Finance */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Coins className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 border border-white/5">
                            Financial Insight
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black tracking-tight leading-tight italic">
                            人件費を「コスト」から<br />「投資」へ変える視点。
                        </h3>
                        <div className="h-px w-20 bg-teal-500" />
                        <div className="text-sm text-slate-300 leading-loose font-medium max-w-xl">
                            {aiContent?.deep_report?.correlation || 
                             "現在の人件費総額は " + (totalLaborCost / 100).toFixed(1) + " 億円規模です。マトリックス図で「人件費サイズ」に切り替え、高単価かつ低生産性の領域がないか確認してください。組織体温が高い（ sun ）状態での高ROIは、持続可能な成長フェーズにあることを示唆しています。"}
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Info className="w-3.5 h-3.5" />
                            Data source: Resource Records & KPI Achievement
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
