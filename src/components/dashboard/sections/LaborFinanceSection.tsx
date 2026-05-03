import { useState, useMemo } from "react";
import { TrendingUp, PieChart, Info, ArrowUpRight, Target, Coins, Users, Activity, Sun, Cloud, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { TabBar } from "@/components/ui/TabBar";

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
        prevPulse: number;
        prevLaborCostPerHead: number;
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
        prevPulse: number;
        prevLaborCostPerHead: number;
        headcount: number;
        laborRoi: number;
    }[];
    avgLaborCostPerHead?: number;
    secondaryAxisName?: string;
    aiContent?: any;
}

/**
 * 象限分析用の散布図（SVG実装）
 */
function QuadrantScatterPlot({ data, avgPulse, avgCost }: { data: any[], avgPulse: number, avgCost: number }) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // グラフの描画設定
    const width = 800;
    const height = 384; // h-96
    const padding = { top: 40, right: 100, bottom: 50, left: 60 };

    // Y軸スケール計算（データ連動）
    const pulses = [...data.map(d => d.pulse), ...data.map(d => d.prevPulse)];
    const minPulse = pulses.length > 0 ? Math.max(0, Math.min(...pulses) - 0.5) : 0;
    const maxPulse = pulses.length > 0 ? Math.min(5, Math.max(...pulses) + 0.5) : 5;
    
    // X軸スケール計算
    const costs = data.map(d => d.laborCostPerHead).filter(c => c > 0);
    const prevCosts = data.map(d => d.prevLaborCostPerHead).filter(c => c > 0);
    const allCosts = [...costs, ...prevCosts];
    
    const minCost = allCosts.length > 0 ? Math.max(0, Math.min(...allCosts) - 20) : 0;
    const maxCost = allCosts.length > 0 ? Math.max(...allCosts) + 20 : 100;

    const getX = (cost: number) => padding.left + ((cost - minCost) / (maxCost - minCost)) * (width - padding.left - padding.right);
    const getY = (pulse: number) => (height - padding.bottom) - ((pulse - minPulse) / (maxPulse - minPulse)) * (height - padding.top - padding.bottom);

    // 目盛り用の数値（4等分）
    const yTicks = [minPulse, minPulse + (maxPulse - minPulse) * 0.25, minPulse + (maxPulse - minPulse) * 0.5, minPulse + (maxPulse - minPulse) * 0.75, maxPulse];
    const xTicks = [minCost, minCost + (maxCost - minCost) * 0.25, minCost + (maxCost - minCost) * 0.5, minCost + (maxCost - minCost) * 0.75, maxCost];

    return (
        <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal" />
                        体温 × コスト 象限分析
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Organizational Health vs. Cost Baseline</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-teal" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ROI 100+</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ROI 60+</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Under 60</span>
                    </div>
                </div>
            </div>

            <div className="relative" style={{ height: `${height}px` }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#CBD5E1" />
                        </marker>
                    </defs>

                    {/* Y軸の目盛りとグリッド */}
                    {yTicks.map((val, i) => (
                        <g key={`ytick-${i}`}>
                            <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} stroke="#F1F5F9" strokeWidth="1" />
                            <text x={padding.left - 8} y={getY(val) + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold">{val.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* X軸の目盛り */}
                    {xTicks.map((val, i) => (
                        <g key={`xtick-${i}`}>
                            <text x={getX(val)} y={height - padding.bottom + 15} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold">{Math.round(val)}</text>
                        </g>
                    ))}

                    {/* 象限ライン（平均値） */}
                    <line x1={padding.left} y1={getY(avgPulse)} x2={width - padding.right} y2={getY(avgPulse)} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1={getX(avgCost)} y1={padding.top} x2={getX(avgCost)} y2={height - padding.bottom} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />

                    {/* 象限ラベル */}
                    <text x={padding.left + 10} y={padding.top + 20} className="text-[10px] font-black fill-emerald-600 uppercase tracking-widest opacity-40">自律型高効率</text>
                    <text x={width - padding.right - 80} y={padding.top + 20} className="text-[10px] font-black fill-indigo-600 uppercase tracking-widest opacity-40">高稼働・厚待遇</text>
                    <text x={padding.left + 10} y={height - padding.bottom - 10} className="text-[10px] font-black fill-amber-600 uppercase tracking-widest opacity-40">投資不足リスク</text>
                    <text x={width - padding.right - 80} y={height - padding.bottom - 10} className="text-[10px] font-black fill-rose-600 uppercase tracking-widest opacity-40">構造的非能率</text>

                    {/* 軸ラベル（横書き） */}
                    <text x={width - padding.right + 10} y={height - padding.bottom + 15} className="text-[9px] font-black fill-slate-400 uppercase tracking-widest">単価(万)</text>
                    <text x={padding.left} y={padding.top - 15} className="text-[9px] font-black fill-slate-400 uppercase tracking-widest">体温</text>

                    {/* データプロット */}
                    {data.map((d, idx) => {
                        if (d.laborCostPerHead === 0) return null;
                        
                        const currX = getX(d.laborCostPerHead);
                        const currY = getY(d.pulse);
                        const prevX = getX(d.prevLaborCostPerHead);
                        const prevY = getY(d.prevPulse);
                        
                        const size = Math.max(28, Math.min(64, d.kpiAch * 0.5));
                        const color = d.laborRoi >= 100 ? "#0D9488" : d.laborRoi >= 60 ? "#F59E0B" : "#EF4444";
                        const isHovered = hoveredId === d.id;

                        // 前月からの変化が一定以上の場合は矢印を表示
                        const hasSignificantChange = Math.abs(d.pulse - d.prevPulse) >= 0.1 || Math.abs(d.laborCostPerHead - d.prevLaborCostPerHead) >= 1;

                        // ラベルの重なり防止（上下交互にずらす）
                        const labelYOffset = (size / 2) + (idx % 2 === 0 ? 14 : 28);

                        return (
                            <g key={d.id} onMouseEnter={() => setHoveredId(d.id)} onMouseLeave={() => setHoveredId(null)} className="cursor-pointer">
                                {hasSignificantChange && !isHovered && (
                                    <line x1={prevX} y1={prevY} x2={currX} y2={currY} stroke="#CBD5E1" strokeWidth="1.5" markerEnd="url(#arrow)" opacity="0.6" />
                                )}
                                
                                <circle cx={currX} cy={currY} r={size / 2} fill={color} opacity={isHovered ? 1 : 0.8} stroke="white" strokeWidth="2" className="transition-all duration-300" />
                                
                                <text x={currX} y={currY + labelYOffset} textAnchor="middle" className="text-[10px] font-bold fill-slate-700 pointer-events-none">{d.name}</text>

                                {isHovered && (
                                    <g className="pointer-events-none">
                                        <rect x={currX + 15} y={currY - 50} width="120" height="60" rx="8" fill="#1E293B" opacity="0.95" />
                                        <text x={currX + 25} y={currY - 35} className="text-[10px] font-black fill-white">{d.name}</text>
                                        <text x={currX + 25} y={currY - 20} className="text-[9px] fill-slate-300">体温: {d.pulse.toFixed(1)} / KPI: {d.kpiAch}%</text>
                                        <text x={currX + 25} y={currY - 8} className="text-[9px] fill-slate-300">単価: {d.laborCostPerHead}万 / ROI: {d.laborRoi}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
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

    const avgPulse = activeData.length > 0 
        ? activeData.reduce((a, b) => a + b.pulse, 0) / activeData.length 
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

            {/* セクション③：象限分析（散布図） */}
            <QuadrantScatterPlot 
                data={activeData} 
                avgPulse={avgPulse} 
                avgCost={avgLaborCostPerHead} 
            />

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
