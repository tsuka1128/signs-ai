"use client";

import { useMemo, useState } from "react";
import { ScatterPlot, colors, getDotColor, getMovementDirection } from "@/components/dashboard/ScatterPlot";
import { EmptyState } from "@/components/ui/EmptyState";
import { AreaChart, Lightbulb, TrendingUp, Users, Target, Shield, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface MatrixSectionProps {
    secondaryAxisName: string;
    sizeKpiName: string;
    month: string;
    setMonth: (m: string) => void;
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
    month,
    setMonth,
    deptData,
    axisData,
    aiContent,
    hasLaborData
}: MatrixSectionProps) {
    const [sizeBase, setSizeBase] = useState<"kpi" | "labor">("kpi");
    const [yAxisMode, setYAxisMode] = useState<"kpi" | "productivity">("kpi");
    const [showTrajectory, setShowTrajectory] = useState(true);
    const [excludedDeptIds, setExcludedDeptIds] = useState<string[]>([]);
    const [excludedAxisIds, setExcludedAxisIds] = useState<string[]>([]);

    // 散布図へ流し込むためのデータ整形
    const deptScatterData = useMemo(() => {
        return deptData.map(d => ({
            ...d,
            head: d.head || d.masterHeadcount || 0,
            sizeValue: sizeBase === "labor" ? d.totalLaborCost : d.sizeValue
        }));
    }, [deptData, sizeBase]);

    const axisScatterData = useMemo(() => {
        return axisData.map(d => ({
            ...d,
            head: d.head || d.masterHeadcount || 0,
            sizeValue: sizeBase === "labor" ? d.totalLaborCost : d.sizeValue
        }));
    }, [axisData, sizeBase]);

    const filteredDeptScatterData = useMemo(() => {
        return deptScatterData.filter(d => !excludedDeptIds.includes(d.id));
    }, [deptScatterData, excludedDeptIds]);

    const filteredAxisScatterData = useMemo(() => {
        return axisScatterData.filter(d => !excludedAxisIds.includes(d.id));
    }, [axisScatterData, excludedAxisIds]);

    const displaySizeKpiName = sizeBase === "labor" ? "人件費の大きさ" : sizeKpiName;

    // タイムラプス選択月の特定用
    const targetIdx = useMemo(() => {
        const monthsMap: Record<string, number> = {
            "default": 12, "1m": 11, "3m": 9, "6m": 6, "12m": 0
        };
        return monthsMap[month] ?? 12;
    }, [month]);

    // クライアント側自動見出し
    const deptAutoInsight = useMemo(() => getAutoInsight(filteredDeptScatterData, yAxisMode, false, secondaryAxisName), [filteredDeptScatterData, yAxisMode, secondaryAxisName]);
    const axisAutoInsight = useMemo(() => getAutoInsight(filteredAxisScatterData, yAxisMode, true, secondaryAxisName), [filteredAxisScatterData, yAxisMode, secondaryAxisName]);

    return (
        <div className="space-y-6">
            {/* コントロールパネル (共通化・最上部に配置) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">組織マップ制御</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Map Configuration & Timeline</p>
                    </div>

                    {/* Y軸切り替えトグル */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Y軸モード:</span>
                        <div className="flex bg-slate-100 p-0.5 rounded-full text-xs font-bold shadow-inner">
                            <button
                                onClick={() => setYAxisMode("kpi")}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-wider",
                                    yAxisMode === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                成果重視 (達成率)
                            </button>
                            <button
                                onClick={() => setYAxisMode("productivity")}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-wider",
                                    yAxisMode === "productivity" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                組織開発重視 (生産性)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4">
                    {/* タイムラプス (共通) */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Lapse:</span>
                        <div className="flex bg-slate-100 p-0.5 rounded-full text-xs font-bold shadow-inner">
                            {[{ id: "default", label: "現在" }, { id: "1m", label: "1ヶ月前" }, { id: "3m", label: "3ヶ月前" }, { id: "6m", label: "6ヶ月前" }, { id: "12m", label: "1年前" }].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setMonth(t.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-wider",
                                        (month || "default") === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 軌跡表示ON/OFF */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3.5 py-1.5 shadow-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                            <input
                                type="checkbox"
                                checked={showTrajectory}
                                onChange={(e) => setShowTrajectory(e.target.checked)}
                                className="rounded border-slate-200 text-teal focus:ring-teal w-3.5 h-3.5 cursor-pointer accent-teal-600"
                            />
                            <span>軌跡（動く地図）を表示</span>
                        </label>
                    </div>

                    {/* サイズ基準 (人件費データがある場合のみ) */}
                    {hasLaborData && (
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">サイズ重視:</span>
                            <div className="flex bg-slate-100 p-0.5 rounded-full text-xs font-bold shadow-inner">
                                <button
                                    onClick={() => setSizeBase("kpi")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-wider",
                                        sizeBase === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    均一
                                </button>
                                <button
                                    onClick={() => setSizeBase("labor")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-wider",
                                        sizeBase === "labor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    人件費投資
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. 部署マトリックス (主役) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all space-y-6">
                <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight">部署マトリックス</h3>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100">規模 × 成果 × 健康</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">X: メンバー数 ｜ Y: {yAxisMode === "kpi" ? "KPI達成率" : "一人当たり生産性"} ｜ 色: 組織体温</p>
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
                    <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                        {/* 左側: 散布図 (560px固定) */}
                        <div className="w-full lg:w-[560px] shrink-0">
                            <ScatterPlot
                                data={filteredDeptScatterData}
                                isProduct={false}
                                sizeKpiName={displaySizeKpiName}
                                yAxisMode={yAxisMode}
                                month={month}
                                showTrajectory={showTrajectory}
                            />
                        </div>

                        {/* 右側: 凡例兼フィルタパネル */}
                        <div className="flex-1 w-full lg:max-w-[240px] bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">凡例 ＆ フィルタ</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setExcludedDeptIds([])}
                                        className="text-[9px] font-black text-teal-600 hover:text-teal-700 transition-colors"
                                    >
                                        すべて選択
                                    </button>
                                    <span className="text-slate-300 text-[9px]">|</span>
                                    <button
                                        onClick={() => setExcludedDeptIds(deptScatterData.map(d => d.id))}
                                        className="text-[9px] font-black text-slate-500 hover:text-slate-600 transition-colors"
                                    >
                                        すべて解除
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                {deptScatterData.map((d) => {
                                    const isChecked = !excludedDeptIds.includes(d.id);
                                    const dotColor = getDotColor(d);
                                    const movement = getMovementDirection(d, yAxisMode, targetIdx);
                                    return (
                                        <label
                                            key={d.id}
                                            className={cn(
                                                "flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-transparent cursor-pointer transition-all hover:bg-slate-100/50 select-none",
                                                isChecked ? "bg-white shadow-sm border-slate-100" : "opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 truncate">
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
                                                    className="rounded border-slate-200 text-teal focus:ring-teal w-3.5 h-3.5 cursor-pointer accent-teal-600"
                                                />
                                                <span 
                                                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                    style={{ backgroundColor: isChecked ? dotColor : colors.gray }} 
                                                />
                                                <span className="text-[11px] font-bold text-slate-700 truncate">{d.name}</span>
                                            </div>
                                            <span className={cn("text-[9px] font-black shrink-0 ml-2", isChecked ? movement.color : "text-slate-400")}>
                                                {movement.arrow}
                                            </span>
                                        </label>
                                    );
                                })}
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
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">X: 領域人数 ｜ Y: {yAxisMode === "kpi" ? "KPI達成率" : "一人当たり生産性"} ｜ 色: 組織体温</p>
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
                    <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                        {/* 左側: 散布図 (560px固定) */}
                        <div className="w-full lg:w-[560px] shrink-0">
                            <ScatterPlot
                                data={filteredAxisScatterData}
                                isProduct={true}
                                sizeKpiName={displaySizeKpiName}
                                yAxisMode={yAxisMode}
                                month={month}
                                showTrajectory={showTrajectory}
                            />
                        </div>

                        {/* 右側: 凡例兼フィルタパネル */}
                        <div className="flex-1 w-full lg:max-w-[240px] bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">凡例 ＆ フィルタ</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setExcludedAxisIds([])}
                                        className="text-[9px] font-black text-teal-600 hover:text-teal-700 transition-colors"
                                    >
                                        すべて選択
                                    </button>
                                    <span className="text-slate-300 text-[9px]">|</span>
                                    <button
                                        onClick={() => setExcludedAxisIds(axisScatterData.map(d => d.id))}
                                        className="text-[9px] font-black text-slate-500 hover:text-slate-600 transition-colors"
                                    >
                                        すべて解除
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                {axisScatterData.map((d) => {
                                    const isChecked = !excludedAxisIds.includes(d.id);
                                    const dotColor = getDotColor(d);
                                    const movement = getMovementDirection(d, yAxisMode, targetIdx);
                                    return (
                                        <label
                                            key={d.id}
                                            className={cn(
                                                "flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-transparent cursor-pointer transition-all hover:bg-slate-100/50 select-none",
                                                isChecked ? "bg-white shadow-sm border-slate-100" : "opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 truncate">
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
                                                    className="rounded border-slate-200 text-teal focus:ring-teal w-3.5 h-3.5 cursor-pointer accent-teal-600"
                                                />
                                                <span 
                                                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                    style={{ backgroundColor: isChecked ? dotColor : colors.gray }} 
                                                />
                                                <span className="text-[11px] font-bold text-slate-700 truncate">{d.name}</span>
                                            </div>
                                            <span className={cn("text-[9px] font-black shrink-0 ml-2", isChecked ? movement.color : "text-slate-400")}>
                                                {movement.arrow}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
