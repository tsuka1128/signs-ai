import { useState, useMemo } from "react";
import { TrendingUp, PieChart, Info, ArrowUpRight, Target, Coins, Users, Activity, Sun, Cloud, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { TabBar } from "@/components/dashboard/common/TabBar";

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
        headcount: number;
        laborRoi: number;
    }[];
    axisFinanceData?: {
        id: string;
        name: string;
        laborCostPerHead: number;
        totalLaborCost: number;
        kpiAch: number;
        pulse: number;
        headcount: number;
        laborRoi: number;
    }[];
    avgLaborCostPerHead?: number;
    secondaryAxisName?: string;
    aiContent?: any;
}

export function LaborFinanceSection({ 
    laborRoi, 
    laborDistRate, 
    totalLaborCost, 
    deptFinanceData = [], 
    axisFinanceData = [],
    avgLaborCostPerHead = 0,
    secondaryAxisName,
    aiContent 
}: LaborFinanceSectionProps) {
    const [financeView, setFinanceView] = useState<'dept' | 'axis'>('dept');
    const hasDistRate = laborDistRate > 0;
    const hasAxisData = axisFinanceData.length > 0;

    const activeData = financeView === 'dept' ? deptFinanceData : axisFinanceData;

    // 効率スコアの算出とソート
    const sortedData = useMemo(() => {
        return [...activeData]
            .map(d => ({ 
                ...d, 
                efficiency: d.laborCostPerHead > 0 ? d.kpiAch / d.laborCostPerHead : 0 
            }))
            .sort((a, b) => b.efficiency - a.efficiency);
    }, [activeData]);

    const maxEff = Math.max(...sortedData.map(d => d.efficiency), 1);

    // AI提言用のグルーピング
    const alertDepts = activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead > avgLaborCostPerHead);
    const cautionDepts = activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead <= avgLaborCostPerHead);
    const idealDepts = activeData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead <= avgLaborCostPerHead);

    const avgAch = activeData.length > 0 
        ? Math.round(activeData.reduce((a, b) => a + b.kpiAch, 0) / activeData.length) 
        : 0;

    const tabs = [
        { id: 'dept', label: '部署別' },
        { id: 'axis', label: `${secondaryAxisName || '担当領域'}別` }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* セクション①：サマリーKPI */}
            <div className={cn(
                "grid gap-4",
                hasDistRate ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
            )}>
                {/* ROI Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-teal" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal rounded-full text-[9px] font-black uppercase tracking-widest">
                            <ArrowUpRight className="w-3 h-3" />
                            ROI
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                            人件費ROI
                            <div className="relative group/roi text-left">
                                <button className="w-3 h-3 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-500 flex items-center justify-center text-[8px] font-black cursor-help transition-colors select-none">?</button>
                                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 text-white p-3 rounded-lg shadow-xl text-[10px] leading-relaxed hidden group-hover/roi:block z-[40]">
                                    平均KPI達成率 ÷ (総人件費 / 100)
                                </div>
                            </div>
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter">{laborRoi.toFixed(1)}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                        数値が高いほど、少ない人件費で高いKPI達成率を実現できています。
                    </p>
                </div>

                {/* Avg Cost Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Average
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 mb-1">一人当たり平均単価</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter">{avgLaborCostPerHead.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">万円</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">全社の基準値。投資判断のベースとなります。</p>
                </div>

                {/* Distribution Rate Card (Optional) */}
                {hasDistRate && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <PieChart className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                                Ratio
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 mb-1">労働分配率</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-800 tracking-tighter">{laborDistRate}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">%</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">売上に対する人件費の比率。収益性の健全性を示します。</p>
                    </div>
                )}
            </div>

            {/* セクション②：効率分析一覧テーブル */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-teal" />
                            {financeView === 'dept' ? '部署別' : `${secondaryAxisName || '担当領域'}別`} 効率分析一覧
                        </h3>
                        {hasAxisData && (
                            <div className="flex items-center">
                                <TabBar 
                                    tabs={tabs} 
                                    active={financeView} 
                                    onChange={(id: any) => setFinanceView(id)} 
                                />
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Matrix</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">部署名</th>
                                <th className="px-4 py-4 text-center">人数</th>
                                <th className="px-4 py-4 text-center">単価(万)</th>
                                <th className="px-4 py-4 text-center">KPI達成率</th>
                                <th className="px-4 py-4 text-center">体温</th>
                                <th className="px-4 py-4 text-center">ROI</th>
                                <th className="px-6 py-4 text-right">効率スコア</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold">
                            {sortedData.map((d) => {
                                const isLowPulse = d.pulse < 3.0;
                                const isHighCost = d.laborCostPerHead > avgLaborCostPerHead;
                                const isHighAch = d.kpiAch >= 100;
                                
                                // 効率スコアを5段階の●で表示
                                const scoreIdx = maxEff > 0 ? Math.ceil((d.efficiency / maxEff) * 5) : 0;
                                const dots = Array(5).fill(0).map((_, i) => (
                                    <span key={i} className={cn(
                                        "inline-block w-1.5 h-1.5 rounded-full mr-0.5",
                                        i < scoreIdx ? "bg-teal" : "bg-slate-100"
                                    )} />
                                ));

                                return (
                                    <tr key={d.id} className={cn(
                                        "border-b border-slate-50 transition-colors hover:bg-slate-50/30",
                                        isLowPulse && "bg-rose-50/40"
                                    )}>
                                        <td className="px-6 py-4 text-slate-800">{d.name}</td>
                                        <td className="px-4 py-4 text-center text-slate-500">{d.headcount}名</td>
                                        <td className={cn(
                                            "px-4 py-4 text-center",
                                            isHighCost ? "text-amber-500" : "text-slate-600"
                                        )}>
                                            {d.laborCostPerHead > 0 ? `${d.laborCostPerHead}万` : <span className="text-slate-300">データなし</span>}
                                        </td>
                                        <td className={cn(
                                            "px-4 py-4 text-center",
                                            isHighAch ? "text-teal font-black" : "text-slate-600"
                                        )}>
                                            {d.kpiAch}%
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {d.pulse >= 4.0 ? <Sun className="w-3 h-3 text-amber-400" /> : d.pulse >= 3.0 ? <Cloud className="w-3 h-3 text-slate-300" /> : <CloudRain className="w-3 h-3 text-slate-400" />}
                                                <span className={cn(isLowPulse ? "text-rose-500" : "text-slate-600")}>{d.pulse.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className={cn(
                                            "px-4 py-4 text-center tabular-nums",
                                            d.laborRoi >= 100 ? "text-teal font-black" : 
                                            d.laborRoi >= 80 ? "text-slate-600" : "text-slate-400"
                                        )}>
                                            {d.laborRoi.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {d.laborCostPerHead > 0 ? dots : <span className="text-[10px] text-slate-300">算出不能</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* セクション③：象限分析 */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Target className="w-5 h-5 text-teal" />
                            体温 × コスト 象限分析
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Organizational Health vs. Cost Baseline</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase">全社平均</span>
                        <span className="text-xs font-black text-slate-700">{avgLaborCostPerHead}万</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
                    {/* Quarter 1: High Pulse, Low Cost */}
                    <div className="bg-emerald-50/20 p-8 min-h-[140px] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">理想的</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">自律型高効率</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead <= avgLaborCostPerHead).map(d => (
                                <div key={d.id} className="px-3 py-2 bg-white border border-emerald-100 rounded-xl shadow-sm flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">体温 {d.pulse.toFixed(1)} / {d.laborCostPerHead}万</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Quarter 2: High Pulse, High Cost */}
                    <div className="bg-indigo-50/20 p-8 min-h-[140px] space-y-3 border-l border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest">安定投資</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">高稼働・厚待遇</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead > avgLaborCostPerHead).map(d => (
                                <div key={d.id} className="px-3 py-2 bg-white border border-indigo-100 rounded-xl shadow-sm flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">体温 {d.pulse.toFixed(1)} / {d.laborCostPerHead}万</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Quarter 3: Low Pulse, Low Cost */}
                    <div className="bg-amber-50/20 p-8 min-h-[140px] space-y-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-widest">要注意</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">投資不足リスク</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead <= avgLaborCostPerHead).map(d => (
                                <div key={d.id} className="px-3 py-2 bg-white border border-amber-100 rounded-xl shadow-sm flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">体温 {d.pulse.toFixed(1)} / {d.laborCostPerHead}万</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Quarter 4: Low Pulse, High Cost */}
                    <div className="bg-rose-50/20 p-8 min-h-[140px] space-y-3 border-t border-l border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-widest">警告域</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">構造的非能率</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead > avgLaborCostPerHead).map(d => (
                                <div key={d.id} className="px-3 py-2 bg-white border border-rose-100 rounded-xl shadow-sm ring-1 ring-rose-100 flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">体温 {d.pulse.toFixed(1)} / {d.laborCostPerHead}万</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* セクション④：AIアクション提言 */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Coins className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 border border-white/5">
                            AI Action Recommendations
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="text-lg font-bold text-slate-100 leading-relaxed max-w-2xl italic border-l-4 border-teal-500 pl-6">
                            {aiContent?.deep_report?.correlation || 
                             `現在の全社ROI ${laborRoi.toFixed(1)} は、${avgLaborCostPerHead}万円の投資に対して平均KPI達成率 ${avgAch}% を実現しています。`}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {alertDepts.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-start gap-4">
                                    <span className="text-lg">🔴</span>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-rose-400 uppercase tracking-widest">警告域：高コスト・低体温</div>
                                        <div className="text-sm font-bold text-slate-200">
                                            [{alertDepts.map(d => d.name).join(", ")}] → マネージャーとの1on1実施を推奨
                                        </div>
                                    </div>
                                </div>
                            )}
                            {cautionDepts.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-start gap-4">
                                    <span className="text-lg">🟡</span>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-amber-400 uppercase tracking-widest">要注意：投資不足リスク</div>
                                        <div className="text-sm font-bold text-slate-200">
                                            [{cautionDepts.map(d => d.name).join(", ")}] → 目標・役割の明確化を検討
                                        </div>
                                    </div>
                                </div>
                            )}
                            {idealDepts.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-start gap-4">
                                    <span className="text-lg">🟢</span>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-teal-400 uppercase tracking-widest">理想的：高効率維持中</div>
                                        <div className="text-sm font-bold text-slate-200">
                                            [{idealDepts.map(d => d.name).join(", ")}] → 採用強化・他部署への横展開を検討
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Info className="w-3.5 h-3.5" />
                            Data source: Financial Baseline Analysis
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
