"use client";

import { useMemo, useState } from "react";
import { ScatterPlot, colors, getDotColor, getMovementDirection } from "@/components/dashboard/ScatterPlot";
import { EmptyState } from "@/components/ui/EmptyState";
import { AreaChart, Lightbulb, TrendingUp, Users, Target, Shield, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { getWeatherFromPulse } from "@/lib/logic/kpi-engine";

interface MatrixSectionProps {
    secondaryAxisName: string;
    sizeKpiName: string;
    deptData: any[];
    axisData: any[];
    aiContent?: any;
    hasLaborData?: boolean;
}

// 自動読み取り見出し（クライアント計算）の生成関数
function getAutoInsight(data: any[], yAxisMode: "kpi" | "productivity", isAxis: boolean, secondaryAxisName: string) {
    if (!data || data.length === 0) return "";

    const hValues = data.map((d) => d.head);
    const yValues = data.map((d) => yAxisMode === "kpi" ? d.kpiAch : d.productivity);

    const maxH = hValues.length > 0 ? Math.max(...hValues, 10) * 1.3 : 50;
    const defaultMaxY = yAxisMode === "kpi" ? 100 : 10;
    const maxY = yValues.length > 0 ? Math.max(...yValues, defaultMaxY) * 1.2 : 120;

    const thresholdH = maxH / 2;
    const thresholdY = maxY / 2;

    const overweight = data.filter(d => d.head >= thresholdH && (yAxisMode === "kpi" ? d.kpiAch : d.productivity) < thresholdY);
    const scale = data.filter(d => d.head >= thresholdH && (yAxisMode === "kpi" ? d.kpiAch : d.productivity) >= thresholdY);
    const pioneer = data.filter(d => d.head < thresholdH && (yAxisMode === "kpi" ? d.kpiAch : d.productivity) >= thresholdY);

    const typeLabel = isAxis ? secondaryAxisName : "部署";

    if (overweight.length > 0) {
        const target = overweight.find(d => d.weather === "rain" || d.weather === "cloud") || overweight[0];
        const statusText = target.pulse > 0 ? `体温: ${target.pulse.toFixed(1)}点` : "体温未取得";
        return `【要対応】多人数・低成果の「要テコ入れ」領域にある ${target.name}（${statusText}）の支援・ボトルネック解消が最優先課題です。`;
    }
    if (scale.length > 0) {
        const leading = scale[0];
        return `主力エンジンである ${leading.name} が「拡大期」領域で成果を維持し、組織を力強く牽引しています。`;
    }
    if (pioneer.length > 0) {
        const star = pioneer[0];
        return `少数精鋭の「開拓者」領域にある ${star.name} が、非常に高いリソース効率で優れた成果を創出しています。`;
    }
    return `各${typeLabel}ともにリソースと成果のバランスは概ね良好に推移しています。`;
}

export function MatrixSection({
    secondaryAxisName,
    sizeKpiName,
    deptData,
    axisData,
    aiContent,
    hasLaborData
}: MatrixSectionProps) {
    const [deptSizeBase, setDeptSizeBase] = useState<"kpi" | "labor">("kpi");
    const [deptYAxisMode, setDeptYAxisMode] = useState<"kpi" | "productivity">("kpi");
    const [showDeptTrajectory, setShowDeptTrajectory] = useState(true);
    const [deptMonth, setDeptMonth] = useState("default");
    const [excludedDeptIds, setExcludedDeptIds] = useState<string[]>([]);

    const [axisSizeBase, setAxisSizeBase] = useState<"kpi" | "labor">("kpi");
    const [axisYAxisMode, setAxisYAxisMode] = useState<"kpi" | "productivity">("kpi");
    const [showAxisTrajectory, setShowAxisTrajectory] = useState(true);
    const [axisMonth, setAxisMonth] = useState("default");
    const [excludedAxisIds, setExcludedAxisIds] = useState<string[]>([]);

    // 部署用のタイムラプス選択月の特定用
    const deptTargetIdx = useMemo(() => {
        const monthsMap: Record<string, number> = {
            "default": 12, "1m": 11, "3m": 9, "6m": 6, "12m": 0
        };
        return monthsMap[deptMonth] ?? 12;
    }, [deptMonth]);

    // 部署散布図データ整形
    const deptScatterData = useMemo(() => {
        return deptData.map(d => {
            const pulseAtMonth = d.pulseHistory?.[deptTargetIdx] || 0;
            const headAtMonth = d.headHistory?.[deptTargetIdx] || 0;
            let prodAtMonth = d.productivityHistoryFilled?.[deptTargetIdx] ?? d.productivityHistory?.[deptTargetIdx] ?? 100;

            // 回答なし（pulse === 0）の場合、前月（または直近の過去月）の生産性を位置のフォールバックとして使用する（Filledが無い場合の安全策）
            if (pulseAtMonth === 0 && !d.productivityHistoryFilled && d.pulseHistory && d.productivityHistory) {
                for (let i = deptTargetIdx - 1; i >= 0; i--) {
                    if (d.pulseHistory[i] > 0) {
                        prodAtMonth = d.productivityHistory[i];
                        break;
                    }
                }
            }

            let head = headAtMonth;
            if (head === 0) {
                head = d.masterHeadcount || d.headcount || 0;
            }

            const kpiAchAtMonth = d.kpiAchHistoryFilled?.[deptTargetIdx] ?? d.kpiAchHistory?.[deptTargetIdx] ?? d.kpiAch;

            return {
                ...d,
                head,
                kpiAch: kpiAchAtMonth,
                productivity: prodAtMonth,
                pulse: pulseAtMonth,
                weather: getWeatherFromPulse(pulseAtMonth || d.pulse),
                mrr: 100,
                sizeValue: deptSizeBase === "labor" ? d.totalLaborCost : d.sizeValue
            };
        });
    }, [deptData, deptTargetIdx, deptSizeBase]);

    const filteredDeptScatterData = useMemo(() => {
        return deptScatterData.filter(d => !excludedDeptIds.includes(d.id));
    }, [deptScatterData, excludedDeptIds]);

    // 第2軸用のタイムラプス選択月の特定用
    const axisTargetIdx = useMemo(() => {
        const monthsMap: Record<string, number> = {
            "default": 12, "1m": 11, "3m": 9, "6m": 6, "12m": 0
        };
        return monthsMap[axisMonth] ?? 12;
    }, [axisMonth]);

    // 第2軸散布図データ整形
    const axisScatterData = useMemo(() => {
        return axisData.map(d => {
            const pulseAtMonth = d.pulseHistory?.[axisTargetIdx] || 0;
            const headAtMonth = d.headHistory?.[axisTargetIdx] || 0;
            let prodAtMonth = d.productivityHistoryFilled?.[axisTargetIdx] ?? d.productivityHistory?.[axisTargetIdx] ?? 100;
            const sizeAtMonth = d.sizeHistory ? d.sizeHistory[axisTargetIdx] : 100;

            // 回答なし（pulse === 0）の場合、前月（または直近の過去月）の生産性を位置のフォールバックとして使用する（Filledが無い場合の安全策）
            if (pulseAtMonth === 0 && !d.productivityHistoryFilled && d.pulseHistory && d.productivityHistory) {
                for (let i = axisTargetIdx - 1; i >= 0; i--) {
                    if (d.pulseHistory[i] > 0) {
                        prodAtMonth = d.productivityHistory[i];
                        break;
                    }
                }
            }

            let head = headAtMonth;
            if (head === 0) {
                head = d.xAxisHead || 0;
            }

            const kpiAchAtMonth = d.kpiAchHistoryFilled?.[axisTargetIdx] ?? d.kpiAchHistory?.[axisTargetIdx] ?? d.kpiAch;

            return {
                ...d,
                head,
                kpiAch: kpiAchAtMonth,
                productivity: prodAtMonth,
                pulse: pulseAtMonth,
                weather: getWeatherFromPulse(pulseAtMonth || d.pulse),
                mrr: sizeAtMonth,
                sizeValue: axisSizeBase === "labor" ? d.totalLaborCost : sizeAtMonth
            };
        });
    }, [axisData, axisTargetIdx, axisSizeBase]);

    const filteredAxisScatterData = useMemo(() => {
        return axisScatterData.filter(d => !excludedAxisIds.includes(d.id));
    }, [axisScatterData, excludedAxisIds]);

    const displayDeptSizeKpiName = deptSizeBase === "labor" ? "人件費の大きさ" : sizeKpiName;
    const displayAxisSizeKpiName = axisSizeBase === "labor" ? "人件費の大きさ" : sizeKpiName;

    // クライアント側自動見出し
    const deptAutoInsight = useMemo(() => getAutoInsight(filteredDeptScatterData, deptYAxisMode, false, secondaryAxisName), [filteredDeptScatterData, deptYAxisMode, secondaryAxisName]);
    const axisAutoInsight = useMemo(() => getAutoInsight(filteredAxisScatterData, axisYAxisMode, true, secondaryAxisName), [filteredAxisScatterData, axisYAxisMode, secondaryAxisName]);

    return (
        <div className="space-y-6">
            {/* 1. 部署マトリックス (主役) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all space-y-6">
                <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight">部署マトリックス</h3>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100">規模 × 成果 × 健康</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">X: メンバー数 ｜ Y: {deptYAxisMode === "kpi" ? "KPI達成率" : "一人当たり生産性"} ｜ 色: 組織体温</p>
                    </div>
                </div>

                {/* 自動結論 ＆ AI解説テキスト */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed space-y-2">
                    <div className="flex items-start gap-2">
                        <span className="text-sm shrink-0">📊</span>
                        <div>
                            <p className="font-black text-slate-800">{deptAutoInsight}</p>
                            {/* AIの matrix_insight.dept 解釈テキストを併置 (過去データ互換対応) */}
                            {aiContent?.matrix_insight?.dept ? (
                                <p className="text-slate-500 font-medium mt-1 border-t border-slate-200/50 pt-1">{aiContent.matrix_insight.dept}</p>
                            ) : (
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 italic">
                                    ※AI分析を実行すると、ボトルネックの背景や具体的な組織課題についての詳細解説がここに表示されます。
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 散布図描画 */}
                {deptScatterData.length > 0 ? (
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* 左側: 散布図 (広い画面で伸びる) */}
                        <div className="flex-1 w-full">
                            <ScatterPlot
                                data={filteredDeptScatterData}
                                isProduct={false}
                                sizeKpiName={displayDeptSizeKpiName}
                                yAxisMode={deptYAxisMode}
                                month={deptMonth}
                                showTrajectory={showDeptTrajectory}
                            />
                        </div>

                        {/* 右側: 操作 ＆ フィルタパネル */}
                        <div className="w-full lg:w-[240px] shrink-0 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                            {/* Y軸モード */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Y軸モード:</span>
                                <div className="flex bg-slate-100/60 p-0.5 rounded-xl text-[11px] font-bold shadow-inner">
                                    <button
                                        onClick={() => setDeptYAxisMode("kpi")}
                                        className={cn(
                                            "flex-1 text-center py-1 px-1.5 rounded-lg transition-all font-black tracking-tight",
                                            deptYAxisMode === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        成果 (達成率)
                                    </button>
                                    <button
                                        onClick={() => setDeptYAxisMode("productivity")}
                                        className={cn(
                                            "flex-1 text-center py-1 px-1.5 rounded-lg transition-all font-black tracking-tight",
                                            deptYAxisMode === "productivity" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        組織 (生産性)
                                    </button>
                                </div>
                            </div>

                            {/* タイムラプス */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">タイムラプス:</span>
                                <div className="flex flex-wrap gap-1 bg-slate-100/60 p-1 rounded-xl">
                                    {[{ id: "default", label: "現在" }, { id: "1m", label: "1m前" }, { id: "3m", label: "3m前" }, { id: "6m", label: "6m前" }, { id: "12m", label: "1年前" }].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDeptMonth(t.id)}
                                            className={cn(
                                                "flex-1 min-w-[38px] text-center py-1 px-1.5 rounded-lg transition-all text-[11px] font-black tracking-tighter whitespace-nowrap",
                                                deptMonth === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 軌跡とサイズ重視 */}
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-black text-slate-500 uppercase tracking-wider select-none">
                                    <input
                                        type="checkbox"
                                        checked={showDeptTrajectory}
                                        onChange={(e) => setShowDeptTrajectory(e.target.checked)}
                                        className="rounded border-slate-200 text-teal focus:ring-teal w-3 h-3 cursor-pointer accent-teal-600"
                                    />
                                    <span>軌跡（動く地図）を表示</span>
                                </label>

                                {hasLaborData && (
                                    <div className="flex items-center justify-between border-t border-slate-100/80 pt-2 mt-1">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">サイズ重視:</span>
                                        <div className="flex bg-slate-100/60 p-0.5 rounded-lg shadow-inner">
                                            <button
                                                onClick={() => setDeptSizeBase("kpi")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-md transition-all text-[10px] font-black tracking-tight",
                                                    deptSizeBase === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                均一
                                            </button>
                                            <button
                                                onClick={() => setDeptSizeBase("labor")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-md transition-all text-[10px] font-black tracking-tight",
                                                    deptSizeBase === "labor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                人件費
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 凡例 ＆ フィルタ */}
                            <div className="border-t border-slate-100 pt-3.5 space-y-2">
                                <div className="flex items-center justify-between pb-1">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">凡例 ＆ フィルタ</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setExcludedDeptIds([])}
                                            className="text-[11px] font-black text-teal-600 hover:text-teal-700 transition-colors"
                                        >
                                            全選択
                                        </button>
                                        <span className="text-slate-300 text-[11px]">|</span>
                                        <button
                                            onClick={() => setExcludedDeptIds(deptScatterData.map(d => d.id))}
                                            className="text-[11px] font-black text-slate-500 hover:text-slate-600 transition-colors"
                                        >
                                            全解除
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                                    {deptScatterData.map((d) => {
                                        const isChecked = !excludedDeptIds.includes(d.id);
                                        const dotColor = getDotColor(d);
                                        const movement = getMovementDirection(d, deptYAxisMode, deptTargetIdx);
                                        return (
                                            <label
                                                key={d.id}
                                                className={cn(
                                                    "flex items-center justify-between px-2 py-1 rounded-lg border border-transparent cursor-pointer transition-all hover:bg-slate-100/50 select-none",
                                                    isChecked ? "bg-white shadow-sm border-slate-100" : "opacity-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setExcludedDeptIds(prev => prev.filter(id => id !== d.id));
                                                            } else {
                                                                setExcludedDeptIds(prev => [...prev, d.id]);
                                                            }
                                                        }}
                                                        className="rounded border-slate-200 text-teal focus:ring-teal w-3 h-3 cursor-pointer accent-teal-600"
                                                    />
                                                    <span 
                                                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                        style={{ backgroundColor: isChecked ? dotColor : colors.gray }} 
                                                    />
                                                    <span className="text-[12px] font-bold text-slate-700 truncate">{d.name}</span>
                                                </div>
                                                <span className={cn("text-[10px] font-black shrink-0 ml-2", isChecked ? movement.color : "text-slate-400")}>
                                                    {movement.arrow}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[560px] mx-auto">
                        <EmptyState
                            title="表示可能な部署データがありません"
                            description="部署の実績・アンケート結果を登録してください。"
                            icon={<AreaChart className="w-12 h-12 text-slate-200" />}
                        />
                    </div>
                )}
            </div>

            {/* 2. 第2軸（プロダクト別等）マトリックス（第2軸が設定されている場合のみ表示） */}
            {axisScatterData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-800 tracking-tight">{secondaryAxisName}マトリックス</h3>
                                <span className="text-[8px] bg-teal-50 text-teal-600 font-bold px-2 py-0.5 rounded-full border border-teal-100">規模 × 成果 × 健康</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">X: 領域人数 ｜ Y: {axisYAxisMode === "kpi" ? "KPI達成率" : "一人当たり生産性"} ｜ 色: 組織体温</p>
                        </div>
                    </div>

                    {/* 自動結論 ＆ AI解説テキスト */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="text-sm shrink-0">🎯</span>
                            <div>
                                <p className="font-black text-slate-800">{axisAutoInsight}</p>
                                {/* AIの matrix_insight.axis 解釈テキストを併置 (過去データ互換対応) */}
                                {aiContent?.matrix_insight?.axis ? (
                                    <p className="text-slate-500 font-medium mt-1 border-t border-slate-200/50 pt-1">{aiContent.matrix_insight.axis}</p>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 italic">
                                        ※AI分析を実行すると、この領域のコスト効率や配置リソースに関する詳細解説がここに表示されます。
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 散布図描画 */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* 左側: 散布図 (広い画面で伸びる) */}
                        <div className="flex-1 w-full">
                            <ScatterPlot
                                data={filteredAxisScatterData}
                                isProduct={true}
                                sizeKpiName={displayAxisSizeKpiName}
                                yAxisMode={axisYAxisMode}
                                month={axisMonth}
                                showTrajectory={showAxisTrajectory}
                            />
                        </div>

                        {/* 右側: 操作 ＆ フィルタパネル */}
                        <div className="w-full lg:w-[240px] shrink-0 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                            {/* Y軸モード */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Y軸モード:</span>
                                <div className="flex bg-slate-100/60 p-0.5 rounded-xl text-[11px] font-bold shadow-inner">
                                    <button
                                        onClick={() => setAxisYAxisMode("kpi")}
                                        className={cn(
                                            "flex-1 text-center py-1 px-1.5 rounded-lg transition-all font-black tracking-tight",
                                            axisYAxisMode === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        成果 (達成率)
                                    </button>
                                    <button
                                        onClick={() => setAxisYAxisMode("productivity")}
                                        className={cn(
                                            "flex-1 text-center py-1 px-1.5 rounded-lg transition-all font-black tracking-tight",
                                            axisYAxisMode === "productivity" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        組織 (生産性)
                                    </button>
                                </div>
                            </div>

                            {/* タイムラプス */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">タイムラプス:</span>
                                <div className="flex flex-wrap gap-1 bg-slate-100/60 p-1 rounded-xl">
                                    {[{ id: "default", label: "現在" }, { id: "1m", label: "1m前" }, { id: "3m", label: "3m前" }, { id: "6m", label: "6m前" }, { id: "12m", label: "1年前" }].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setAxisMonth(t.id)}
                                            className={cn(
                                                "flex-1 min-w-[38px] text-center py-1 px-1.5 rounded-lg transition-all text-[11px] font-black tracking-tighter whitespace-nowrap",
                                                axisMonth === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 軌跡とサイズ重視 */}
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-black text-slate-500 uppercase tracking-wider select-none">
                                    <input
                                        type="checkbox"
                                        checked={showAxisTrajectory}
                                        onChange={(e) => setShowAxisTrajectory(e.target.checked)}
                                        className="rounded border-slate-200 text-teal focus:ring-teal w-3 h-3 cursor-pointer accent-teal-600"
                                    />
                                    <span>軌跡（動く地図）を表示</span>
                                </label>

                                {hasLaborData && (
                                    <div className="flex items-center justify-between border-t border-slate-100/80 pt-2 mt-1">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">サイズ重視:</span>
                                        <div className="flex bg-slate-100/60 p-0.5 rounded-lg shadow-inner">
                                            <button
                                                onClick={() => setAxisSizeBase("kpi")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-md transition-all text-[10px] font-black tracking-tight",
                                                    axisSizeBase === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                均一
                                            </button>
                                            <button
                                                onClick={() => setAxisSizeBase("labor")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-md transition-all text-[10px] font-black tracking-tight",
                                                    axisSizeBase === "labor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                人件費
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 凡例 ＆ フィルタ */}
                            <div className="border-t border-slate-100 pt-3.5 space-y-2">
                                <div className="flex items-center justify-between pb-1">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">凡例 ＆ フィルタ</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setExcludedAxisIds([])}
                                            className="text-[11px] font-black text-teal-600 hover:text-teal-700 transition-colors"
                                        >
                                            全選択
                                        </button>
                                        <span className="text-slate-300 text-[11px]">|</span>
                                        <button
                                            onClick={() => setExcludedAxisIds(axisScatterData.map(d => d.id))}
                                            className="text-[11px] font-black text-slate-500 hover:text-slate-600 transition-colors"
                                        >
                                            全解除
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                                    {axisScatterData.map((d) => {
                                        const isChecked = !excludedAxisIds.includes(d.id);
                                        const dotColor = getDotColor(d);
                                        const movement = getMovementDirection(d, axisYAxisMode, axisTargetIdx);
                                        return (
                                            <label
                                                key={d.id}
                                                className={cn(
                                                    "flex items-center justify-between px-2 py-1 rounded-lg border border-transparent cursor-pointer transition-all hover:bg-slate-100/50 select-none",
                                                    isChecked ? "bg-white shadow-sm border-slate-100" : "opacity-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setExcludedAxisIds(prev => prev.filter(id => id !== d.id));
                                                            } else {
                                                                setExcludedAxisIds(prev => [...prev, d.id]);
                                                            }
                                                        }}
                                                        className="rounded border-slate-200 text-teal focus:ring-teal w-3 h-3 cursor-pointer accent-teal-600"
                                                    />
                                                    <span 
                                                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                        style={{ backgroundColor: isChecked ? dotColor : colors.gray }} 
                                                    />
                                                    <span className="text-[12px] font-bold text-slate-700 truncate">{d.name}</span>
                                                </div>
                                                <span className={cn("text-[10px] font-black shrink-0 ml-2", isChecked ? movement.color : "text-slate-400")}>
                                                    {movement.arrow}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
