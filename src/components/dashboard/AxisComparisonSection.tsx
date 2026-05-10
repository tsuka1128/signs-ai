"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/index";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

// 領域ごとのカラーパレット（最大8領域まで対応）
const AXIS_COLORS = [
    "#14b8a6", // teal
    "#6366f1", // indigo
    "#f59e0b", // amber
    "#ef4444", // red
    "#84cc16", // lime
    "#a855f7", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
];

/* ─── ロジック: コンディション診断 ─────────────────────── */
const KPI_QUALITY_META = {
    healthy: { label: "健全達成", icon: "✨", color: "text-emerald-600", bg: "bg-emerald-50" },
    warning: { label: "構造課題", icon: "⚠️", color: "text-amber-600", bg: "bg-amber-50" },
    alert:   { label: "燃え尽き", icon: "🔥", color: "text-rose-600", bg: "bg-rose-50" },
    critical: { label: "要再建", icon: "🚨", color: "text-rose-700", bg: "bg-rose-100" },
    unknown: { label: "-", icon: "", color: "text-slate-400", bg: "bg-slate-50" }
};

function calcKpiQuality(ach: number, pulse: number) {
    if (ach >= 100 && pulse >= 3.5) return "healthy";
    if (ach >= 100 && pulse < 3.5)  return "alert";
    if (ach < 100 && pulse >= 3.5)  return "warning";
    if (ach < 100 && pulse < 3.5)   return "critical";
    return "unknown";
}

interface AxisComparisonSectionProps {
    axes: any[];
    secondaryAxisName: string;
    aiContent?: any;
}

export function AxisComparisonSection({ axes, secondaryAxisName, aiContent }: AxisComparisonSectionProps) {
    // 領域ごとの色を固定するマップ（idxベースで一度決めると一貫性が保たれる）
    const axisColorMap = useMemo(() => {
        const map = new Map<string, string>();
        axes.forEach((axis, idx) => {
            map.set(axis.id, AXIS_COLORS[idx % AXIS_COLORS.length]);
        });
        return map;
    }, [axes]);

    // 代表KPIの達成率で降順ソート
    const rankedAxes = [...axes].sort((a, b) => {
        const achA = a.kpis?.[0]?.ach ?? a.kpiAch ?? 0;
        const achB = b.kpis?.[0]?.ach ?? b.kpiAch ?? 0;
        return achB - achA;
    });

    // 代表KPI名（全領域で同じKPIを持つため最初の領域から取得）
    const primaryKpiName = axes.find(a => a.kpis?.[0])?.kpis?.[0]?.name ?? "代表KPI";

    // 最大達成率（バーの100%基準）
    const maxAch = Math.max(...rankedAxes.map(a => a.kpis?.[0]?.ach ?? a.kpiAch ?? 0), 1);

    // トレンドチャート用データ（直近6ヶ月）
    const trendMonths = 6;
    const hasHistory = axes.some(a => a.kpiAchHistory?.some((v: number) => v > 0));
    const recentHistory = axes.map(a => ({
        ...a,
        recentAch: (a.kpiAchHistory ?? []).slice(-trendMonths),
    }));

    if (axes.length === 0) {
        return (
            <EmptyState
                title={`${secondaryAxisName}が登録されていません`}
                description={`${secondaryAxisName}ごとの分析を行うには、設定から項目を追加してください。`}
                actionLabel="設定を開く"
                actionHref="/onboarding"
                icon={<Package className="w-12 h-12 text-slate-200" />}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Block 0: 領域コンディション一覧（横スクロール） */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {axes.map((axis) => {
                    const color = axisColorMap.get(axis.id) ?? AXIS_COLORS[0];
                    const quality = calcKpiQuality(axis.kpiAch ?? 0, axis.pulse ?? 0);
                    const meta = KPI_QUALITY_META[quality as keyof typeof KPI_QUALITY_META] || KPI_QUALITY_META.unknown;
                    return (
                        <div
                            key={axis.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col items-center gap-2 shrink-0 min-w-[120px]"
                        >
                            {/* 領域識別カラー帯 */}
                            <div
                                className="w-full h-1 rounded-full mb-1"
                                style={{ backgroundColor: color }}
                            />
                            {/* 天気アイコン */}
                            <WeatherIcon
                                type={axis.pulse === 0 ? "cloud" : axis.weather}
                                size={28}
                                className={axis.pulse === 0 ? "opacity-20 grayscale" : ""}
                            />
                            {/* 領域名 */}
                            <span className="text-xs font-black text-slate-700 text-center leading-tight truncate w-full">
                                {axis.name}
                            </span>
                            {/* コンディション診断 */}
                            {axis.pulse > 0 && axis.kpiAch > 0 ? (
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap",
                                    meta.bg, meta.color
                                )}>
                                    {meta.icon} {meta.label}
                                </span>
                            ) : (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-50 text-slate-300">
                                    データ不足
                                </span>
                            )}
                            {/* 体温 */}
                            <div className="flex flex-col items-center mt-1">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">体温</span>
                                <span className={cn(
                                    "text-base font-black tabular-nums",
                                    axis.pulse >= 3.8 ? "text-emerald-500" :
                                    axis.pulse >= 3.0 ? "text-amber-500" :
                                    axis.pulse > 0    ? "text-rose-500" : "text-slate-300"
                                )}>
                                    {axis.pulse > 0 ? axis.pulse.toFixed(1) : "-"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Block 1: 達成率ランキング */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                        {secondaryAxisName}別 達成率ランキング
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                        代表指標: {primaryKpiName}
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    {rankedAxes.map((axis, idx) => {
                        const ach = axis.kpis?.[0]?.ach ?? axis.kpiAch ?? 0;
                        const val = axis.kpis?.[0]?.val ?? "-";
                        const color = axisColorMap.get(axis.id) ?? AXIS_COLORS[0];
                        const barWidth = maxAch > 0 ? Math.min((ach / maxAch) * 100, 100) : 0;
                        const achColor = ach >= 100 ? "text-emerald-500" : ach >= 80 ? "text-amber-500" : "text-rose-500";

                        return (
                            <div key={axis.id} className="flex items-center gap-4">
                                {/* 順位 */}
                                <span className="text-[11px] font-black text-slate-300 w-4 shrink-0 text-right">
                                    {idx + 1}
                                </span>
                                {/* カラードット */}
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                {/* 領域名 */}
                                <span className="text-sm font-bold text-slate-700 w-28 shrink-0 truncate">
                                    {axis.name}
                                </span>
                                {/* バー */}
                                <div className="flex-1 relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                                        style={{ width: `${barWidth}%`, backgroundColor: color }}
                                    />
                                </div>
                                {/* 値と達成率（2段表示でコンパクトに） */}
                                <div className="flex flex-col items-end shrink-0 w-28">
                                    <span className="text-xs font-black text-slate-700 tabular-nums leading-tight">
                                        {val}
                                    </span>
                                    {ach > 0 && (
                                        <span className={cn("text-[11px] font-black tabular-nums leading-tight", achColor)}>
                                            {ach}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Block 2: トレンド比較チャート */}
            {hasHistory && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 tracking-tight">
                                達成率トレンド比較
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                                直近{trendMonths}ヶ月推移
                            </p>
                        </div>
                        {/* 凡例 */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                            {axes.map((axis) => (
                                <div key={axis.id} className="flex items-center gap-1.5">
                                    <div
                                        className="w-3 h-0.5 rounded-full"
                                        style={{ backgroundColor: axisColorMap.get(axis.id) ?? AXIS_COLORS[0] }}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">
                                        {axis.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <TrendChart axes={recentHistory} trendMonths={trendMonths} colorMap={axisColorMap} />
                    </div>
                </div>
            )}

            {/* Block 3: AI 領域横断インサイト */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                        {secondaryAxisName}横断インサイト（AI）
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                        領域間の学びと資源配分の観点
                    </p>
                </div>
                <div className="text-sm text-slate-600 font-medium leading-relaxed">
                    {aiContent?.deep_report?.strategic_alignment ? (
                        <p>{aiContent.deep_report.strategic_alignment}</p>
                    ) : (
                        <div className="space-y-3 text-slate-400 italic">
                            <p>💭 達成率に差がある領域間で、好調な領域の打ち手を他に横展開できる可能性はないでしょうか。</p>
                            <p>💭 どの領域にリソースを集中・分散させるか、定期的に議論するきっかけにしてみてください。</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Block 4: 詳細カード一覧（折りたたみ可能） */}
            <AxisDetailList axes={axes} />
        </div>
    );
}

/* ─── トレンドチャート（SVG）─────────────────────────── */
function TrendChart({ axes, trendMonths, colorMap }: { axes: any[]; trendMonths: number; colorMap: Map<string, string> }) {
    const W = 600, H = 120, PAD = { top: 8, bottom: 20, left: 32, right: 16 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    // 全データから max/min を計算（最低でも 0〜100 の範囲を確保）
    const allVals = axes.flatMap(a => a.recentAch as number[]).filter(v => v > 0);
    const maxVal = Math.max(...allVals, 100);
    const minVal = Math.max(Math.min(...allVals, 0) - 10, 0);
    const range = maxVal - minVal || 1;

    const toX = (i: number) => PAD.left + (i / (trendMonths - 1)) * chartW;
    const toY = (v: number) => PAD.top + (1 - (v - minVal) / range) * chartH;

    // X軸ラベル（月番号 = 直近6ヶ月を -5,-4,-3,-2,-1,0 で表示）
    const xLabels = Array.from({ length: trendMonths }, (_, i) => {
        const offset = i - (trendMonths - 1);
        return offset === 0 ? "今月" : `${offset}M`;
    });

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ minWidth: "280px" }}
            >
                {/* 目標ライン（100%）*/}
                {maxVal >= 100 && minVal <= 100 && (
                    <line
                        x1={PAD.left} y1={toY(100)}
                        x2={PAD.left + chartW} y2={toY(100)}
                        stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"
                    />
                )}

                {/* 各領域のライン */}
                {axes.map((axis) => {
                    const vals = axis.recentAch as number[];
                    const validPoints = vals.map((v, i) => ({ v, i })).filter(p => p.v > 0);
                    if (validPoints.length < 2) return null;

                    const points = validPoints.map(p => `${toX(p.i)},${toY(p.v)}`).join(" ");
                    const color = colorMap.get(axis.id) ?? AXIS_COLORS[0];

                    return (
                        <g key={axis.id}>
                            <polyline
                                points={points}
                                fill="none"
                                stroke={color}
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            {/* 最新月のドット */}
                            {(() => {
                                const lastValid = [...validPoints].pop();
                                if (!lastValid) return null;
                                return (
                                    <circle
                                        cx={toX(lastValid.i)}
                                        cy={toY(lastValid.v)}
                                        r="3"
                                        fill={color}
                                    />
                                );
                            })()}
                        </g>
                    );
                })}

                {/* X軸ラベル */}
                {xLabels.map((label, i) => (
                    <text
                        key={i}
                        x={toX(i)}
                        y={H - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#94a3b8"
                        fontWeight="700"
                    >
                        {label}
                    </text>
                ))}

                {/* Y軸: 100% ラベル */}
                {maxVal >= 100 && minVal <= 100 && (
                    <text
                        x={PAD.left - 4}
                        y={toY(100) + 3}
                        textAnchor="end"
                        fontSize="8"
                        fill="#cbd5e1"
                        fontWeight="700"
                    >
                        100
                    </text>
                )}
            </svg>
        </div>
    );
}

/* ─── 詳細カード（折りたたみ）─────────────────────────── */
function AxisDetailList({ axes }: { axes: any[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-black text-slate-400 hover:text-slate-600 bg-slate-50/50 rounded-2xl border border-slate-100 transition-colors"
            >
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {open ? "詳細を閉じる" : `各領域の詳細を見る（${axes.length}件）`}
            </button>
            {open && (
                <div className="space-y-4 mt-4">
                    {axes.map((axis, i) => (
                        <OrganizationCard
                            key={i}
                            name={axis.name}
                            head={axis.head}
                            pulse={axis.pulse}
                            weather={axis.weather}
                            arrow={axis.arrow || "flat"}
                            kpis={axis.kpis}
                            laborCostPerHead={axis.laborCostPerHead}
                            isStale={axis.isStale}
                            dataMonth={axis.dataMonth}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
