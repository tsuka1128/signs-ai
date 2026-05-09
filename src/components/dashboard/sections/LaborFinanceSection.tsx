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
        totalLaborCostHistory: number[];
        kpiAch: number;
        pulse: number;
        pulseHistory: number[];
        laborCostHistory: number[];
        headcount: number;
        laborRoi: number;
    }[];
    axisFinanceData?: {
        id: string;
        name: string;
        laborCostPerHead: number;
        totalLaborCost: number;
        totalLaborCostHistory: number[];
        kpiAch: number;
        pulse: number;
        pulseHistory: number[];
        laborCostHistory: number[];
        headcount: number;
        laborRoi: number;
    }[];
    avgLaborCostPerHead?: number;
    secondaryAxisName?: string;
    aiContent?: any;
}

/**
 * 象限分析用の散布図（SVG実装 - リデザイン版）
 */
function QuadrantScatterPlot({ data }: { data: any[] }) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [tlOffset, setTlOffset] = useState(0);

    const timeLapseOptions = [
        { id: 0,  label: "現在" },
        { id: 1,  label: "1ヶ月前" },
        { id: 3,  label: "3ヶ月前" },
        { id: 6,  label: "6ヶ月前" },
        { id: 12, label: "1年前" },
    ];

    // グラフの描画設定 (ScatterPlot.tsx 互換の正方形スタイル)
    const W = 680;
    const H = 680;
    const PAD = { top: 60, right: 60, bottom: 80, left: 60 };

    // 境界線（物理的な中央点）
    const midX_coord = PAD.left + (W - PAD.left - PAD.right) / 2;
    const midY_coord = PAD.top + (H - PAD.top - PAD.bottom) / 2;

    // データの抽出（Time Lapse 適用後）
    const histIndex = 12 - tlOffset;
    const displayData = data.map(d => ({
        ...d,
        pulse: d.pulseHistory?.[histIndex] ?? d.pulse,
        totalLaborCostAtTime: d.totalLaborCostHistory?.[histIndex] ?? Math.round(d.totalLaborCost / 10000),
    })).filter(d => d.totalLaborCostAtTime > 0);

    // Y軸スケール計算（全履歴データから計算してスケールを固定する）
    const allPulses = data.flatMap(d => d.pulseHistory || []);
    const minPulse = allPulses.length > 0 ? Math.max(0, Math.min(...allPulses) - 0.5) : 0;
    const maxPulse = allPulses.length > 0 ? Math.min(5, Math.max(...allPulses) + 0.5) : 5;
    
    // X軸スケール計算（総人件費ベース、万円）
    const allTotalCosts = data.flatMap(d => d.totalLaborCostHistory || []).filter(c => c > 0);
    const minCost = allTotalCosts.length > 0 ? Math.max(0, Math.min(...allTotalCosts) - 100) : 0;
    const maxCost = allTotalCosts.length > 0 ? Math.max(...allTotalCosts) + 100 : 5000;

    const getX = (cost: number) => PAD.left + ((cost - minCost) / (maxCost - minCost)) * (W - PAD.left - PAD.right);
    const getY = (pulse: number) => (H - PAD.bottom) - ((pulse - minPulse) / (maxPulse - minPulse)) * (H - PAD.top - PAD.bottom);

    // 目盛り用の数値（4等分）
    const yTicks = [minPulse, minPulse + (maxPulse - minPulse) * 0.25, minPulse + (maxPulse - minPulse) * 0.5, minPulse + (maxPulse - minPulse) * 0.75, maxPulse];
    const xTicks = [minCost, minCost + (maxCost - minCost) * 0.25, minCost + (maxCost - minCost) * 0.5, minCost + (maxCost - minCost) * 0.75, maxCost];

    // 象限の設定（中央点ベース）
    const quadrants = [
        { x: PAD.left, y: PAD.top, w: midX_coord - PAD.left, h: midY_coord - PAD.top,
          color: "#ECFDF5", label: "自律型高効率", sub: "高体温×低コスト | 少ない投資で高い自律性を維持" },
        { x: midX_coord, y: PAD.top, w: W - PAD.right - midX_coord, h: midY_coord - PAD.top,
          color: "#EFF6FF", label: "高稼働・積極投資", sub: "高体温×高コスト | 投資に見合う成果を要確認" },
        { x: PAD.left, y: midY_coord, w: midX_coord - PAD.left, h: H - PAD.bottom - midY_coord,
          color: "#FFFBEB", label: "停滞リスク", sub: "低体温×低コスト | 組織疲弊と投資不足の懸念" },
        { x: midX_coord, y: midY_coord, w: W - PAD.right - midX_coord, h: H - PAD.bottom - midY_coord,
          color: "#FFF1F2", label: "構造的課題", sub: "低体温×高コスト | 抜本的な構造改革が必要" },
    ];

    return (
        <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal" />
                        体温 × コスト 象限分析
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Organizational Health vs. Cost Baseline</p>
                </div>
                
                {/* Time Lapse UI */}
                <div className="flex bg-slate-100 p-1 rounded-full text-[10px] font-black">
                    {timeLapseOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setTlOffset(opt.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full transition-all duration-300 uppercase tracking-widest",
                                tlOffset === opt.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative mx-auto flex justify-center items-center" style={{ width: '100%', maxWidth: '680px', aspectRatio: '1/1' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                    {/* 象限の背景色とラベル */}
                    {quadrants.map((q, i) => (
                        <g key={`quad-${i}`}>
                            <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} opacity={0.4} />
                            <text x={q.x + 12} y={q.y + 24} className="text-[10px] fill-slate-500 font-bold uppercase tracking-tight">{q.label}</text>
                            <text x={q.x + 12} y={q.y + 38} className="text-[9px] fill-slate-400 font-medium">{q.sub}</text>
                        </g>
                    ))}

                    {/* Y軸の目盛りとグリッド */}
                    {yTicks.map((val, i) => (
                        <g key={`ytick-${i}`}>
                            <line x1={PAD.left} y1={getY(val)} x2={W - PAD.right} y2={getY(val)} stroke="#F1F5F9" strokeWidth="1" />
                            <text x={PAD.left - 8} y={getY(val) + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold">{val.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* X軸の目盛り */}
                    {xTicks.map((val, i) => (
                        <g key={`xtick-${i}`}>
                            <text x={getX(val)} y={H - PAD.bottom + 20} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold">{Math.round(val)}</text>
                        </g>
                    ))}

                    {/* 象限境界線（物理的な中央点） */}
                    <line x1={PAD.left} y1={midY_coord} x2={W - PAD.right} y2={midY_coord} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1={midX_coord} y1={PAD.top} x2={midX_coord} y2={H - PAD.bottom} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />

                    {/* 軸ラベル */}
                    <text x={W - PAD.right} y={H - PAD.bottom + 45} textAnchor="end" className="text-[10px] font-black fill-slate-400 uppercase tracking-[0.2em]">総人件費 (万円)</text>
                    <text x={PAD.left} y={PAD.top - 20} className="text-[10px] font-black fill-slate-400 uppercase tracking-[0.2em]">体温スコア</text>

                    {/* 凡例 */}
                    <g transform={`translate(${W / 2 - 120}, ${H - 25})`}>
                        <circle cx={0} cy={0} r={4} fill="#10B981" opacity={0.3} stroke="#10B981" strokeWidth={1} />
                        <circle cx={0} cy={0} r={1.5} fill="#10B981" />
                        <text x={10} y={4} className="text-[9px] fill-slate-400 font-bold">ROI 100+</text>

                        <circle cx={80} cy={0} r={4} fill="#F59E0B" opacity={0.3} stroke="#F59E0B" strokeWidth={1} />
                        <circle cx={80} cy={0} r={1.5} fill="#F59E0B" />
                        <text x={90} y={4} className="text-[9px] fill-slate-400 font-bold">ROI 60+</text>

                        <circle cx={155} cy={0} r={4} fill="#EF4444" opacity={0.3} stroke="#EF4444" strokeWidth={1} />
                        <circle cx={155} cy={0} r={1.5} fill="#EF4444" />
                        <text x={165} y={4} className="text-[9px] fill-slate-400 font-bold">Under 60</text>
                    </g>

                    {/* データプロット（ホバー要素を最前面にするためソート） */}
                    {[...displayData]
                        .sort((a, b) => (a.id === hoveredId ? 1 : b.id === hoveredId ? -1 : 0))
                        .map((d) => {
                            const currX = getX(d.totalLaborCostAtTime);
                            const currY = getY(d.pulse);
                            
                            const col = d.laborRoi >= 100 ? "#10B981" : d.laborRoi >= 60 ? "#F59E0B" : "#EF4444";
                            const r = Math.max(12, Math.min(48, d.kpiAch * 0.5));
                            const isHovered = hoveredId === d.id;

                            return (
                                <g
                                    key={d.id}
                                    className="transition-all duration-500 cursor-pointer group"
                                    style={{ transform: `translate(${currX}px, ${currY}px)` }}
                                    onMouseEnter={() => setHoveredId(d.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {/* ヒットエリア */}
                                    <circle cx={0} cy={0} r={r + 20} fill="transparent" />

                                    {/* 外円（薄い） */}
                                    <circle cx={0} cy={0} r={r} fill={col} opacity={0.15} stroke={col} strokeWidth={1.5}
                                        className="transition-all duration-300 group-hover:opacity-40" />

                                    {/* 中心ドット */}
                                    <circle cx={0} cy={0} r={4} fill={col} />

                                    {/* ホバーリング */}
                                    <circle cx={0} cy={0} r={r + 4} fill="none" stroke={col} strokeWidth={1.5}
                                        className="opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none"
                                        strokeDasharray="3,2" />

                                    {/* 部署名（常時表示・バブル上） */}
                                    <text x={0} y={-r - 8} textAnchor="middle"
                                        className="text-[11px] font-black fill-slate-800 tracking-tight pointer-events-none">
                                        {d.name}
                                    </text>

                                    {/* ホバー時サブ情報 */}
                                    <text x={0} y={r + 14} textAnchor="middle"
                                        className="text-[9px] fill-slate-400 font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        体温 {d.pulse.toFixed(1)} | {d.totalLaborCostAtTime.toLocaleString()}万 | ROI {d.laborRoi}
                                    </text>
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
    const [simDelta, setSimDelta] = useState(0.5);
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

    // 体温改善シミュレーション
    const improvementSim = useMemo(() => {
        if (activeData.length < 2) return null;

        // 体温 → KPI達成率 の線形回帰（傾きのみ）
        const avgPulse = activeData.reduce((s, d) => s + d.pulse, 0) / activeData.length;
        const avgKpi   = activeData.reduce((s, d) => s + d.kpiAch, 0) / activeData.length;
        const num = activeData.reduce((s, d) => s + (d.pulse - avgPulse) * (d.kpiAch - avgKpi), 0);
        const den = activeData.reduce((s, d) => s + (d.pulse - avgPulse) ** 2, 0);
        let slope = den > 0 ? num / den : 10; // 体温1pt当たりのKPI改善率(%)
        slope = Math.max(slope, 0); // 逆相関の場合は0でクランプ

        // 部署別シミュレーション
        const deptSims = activeData
            .map(d => {
                const currentPulse = d.pulse;
                const targetPulse  = Math.min(5.0, currentPulse + simDelta);
                const pulseGain    = targetPulse - currentPulse;
                const kpiGain      = Math.round(pulseGain * slope * 10) / 10; // %
                const laborCost万  = Math.round(d.totalLaborCost / 10000);
                const valueGain万  = Math.round(laborCost万 * kpiGain / 100);
                return { ...d, targetPulse, pulseGain, kpiGain, valueGain万, laborCost万 };
            })
            .sort((a, b) => a.pulse - b.pulse); // 体温が低い（伸び代がある）順

        const totalValue万 = deptSims.reduce((s, d) => s + d.valueGain万, 0);
        const totalCost万  = deptSims.reduce((s, d) => s + d.laborCost万, 0);
        const ratePercent  = totalCost万 > 0 ? Math.round((totalValue万 / totalCost万) * 100 * 10) / 10 : 0;

        return { slope, deptSims, totalValue万, totalCost万, ratePercent };
    }, [activeData, simDelta]);

    // AI提言用のグルーピング（データ平均ではなく基準値で判定）
    const alertDepts = activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead > avgLaborCostPerHead);
    const cautionDepts = activeData.filter(d => d.pulse < 3.0 && d.laborCostPerHead <= avgLaborCostPerHead);
    const idealDepts = activeData.filter(d => d.pulse >= 3.0 && d.laborCostPerHead <= avgLaborCostPerHead);

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
            <QuadrantScatterPlot data={activeData} />

            {/* セクション④：体温改善シミュレーター */}
            {improvementSim && (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Sun className="w-5 h-5 text-amber-500" />
                                体温改善シミュレーター
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">IMPROVEMENT IMPACT SIMULATOR</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-widest">
                                    <span>体温の改善幅を選択</span>
                                    <span className="text-teal bg-teal-50 px-2 py-0.5 rounded-full">+{simDelta.toFixed(1)}pt</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={simDelta}
                                    onChange={(e) => setSimDelta(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                    <span>0.1</span>
                                    <span>2.0</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center min-w-[140px]">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">推定改善価値</div>
                                    <div className="text-2xl font-black text-teal tracking-tighter">+{improvementSim.totalValue万.toLocaleString()}<span className="text-xs ml-0.5">万円</span></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center min-w-[140px]">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">総人件費比</div>
                                    <div className="text-2xl font-black text-teal tracking-tighter">+{improvementSim.ratePercent}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                部署別インパクト内訳
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {improvementSim.deptSims.map(d => (
                                    <div key={d.id} className="bg-white/50 border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:bg-white transition-colors">
                                        <div className="space-y-1">
                                            <div className="text-xs font-black text-slate-800">{d.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold">
                                                体温 {d.pulse.toFixed(1)} → {d.targetPulse.toFixed(1)} (+{d.pulseGain.toFixed(1)})
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-teal">+{d.valueGain万.toLocaleString()}万</div>
                                            <div className="text-[10px] text-slate-400 font-bold">+KPI {d.kpiGain}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold italic">
                        <Info className="w-3 h-3" />
                        ※ 全部署の体温-KPI相関（傾き: {improvementSim.slope.toFixed(1)}%/pt）に基づき、コストボリュームを加味して算出しています。
                    </div>
                </div>
            )}

            {/* セクション⑤：AIアクション提言 */}
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
                             `現在の全社人件費ROI分析に基づき、各部署のコンディションとコスト構造の最適化に向けたアクションを提示します。`}
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
