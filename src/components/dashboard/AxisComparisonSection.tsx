"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { calcKpiQuality, KPI_QUALITY_META } from "@/lib/logic/kpi-engine";
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

interface AxisComparisonSectionProps {
    axes: any[];
    secondaryAxisName: string;
    aiContent?: any;
}

export function AxisComparisonSection({ axes, secondaryAxisName, aiContent }: AxisComparisonSectionProps) {
    // 領域ごとの色を固定するマップ
    const axisColorMap = useMemo(() => {
        const map = new Map<string, string>();
        axes.forEach((axis, idx) => {
            map.set(axis.id, AXIS_COLORS[idx % AXIS_COLORS.length]);
        });
        return map;
    }, [axes]);

    // 全領域に存在する全てのKPI名を取得（重複なし）
    const allKpiNames = useMemo(() => {
        const names = new Set<string>();
        axes.forEach(ax => ax.kpis?.forEach((k: any) => names.add(k.name)));
        return Array.from(names);
    }, [axes]);

    // 代表KPI名（最初のKPI）
    const primaryKpiName = axes.find(a => a.kpis?.[0])?.kpis?.[0]?.name ?? "代表KPI";

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
                    const meta = KPI_QUALITY_META[quality];
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

            {/* Block 1: KPI別達成率ランキング */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                        {secondaryAxisName}別 KPI 実績値ランキング
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                        バー = 実績値の大小 ｜ 右端 = 目標達成率
                    </p>
                </div>
                <div className="p-6 space-y-10">
                    {allKpiNames.map(kpiName => {
                        const entries = [...axes]
                            .map(ax => ({ ax, kpi: ax.kpis?.find((k: any) => k.name === kpiName) }))
                            .filter(({ kpi }) => kpi);

                        const numericVals = entries.map(({ kpi }) =>
                            parseFloat(String(kpi.val ?? "0").replace(/[^0-9.]/g, "")) || 0
                        );
                        const maxNumericVal = Math.max(...numericVals, 1);

                        return (
                            <div key={kpiName} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpiName}</h4>
                                    {kpiName === primaryKpiName && (
                                        <span className="text-[8px] font-black bg-teal/5 text-teal px-1.5 py-0.5 rounded uppercase">代表指標</span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {entries
                                        .sort((a, b) => (b.kpi.ach ?? 0) - (a.kpi.ach ?? 0))
                                        .map(({ ax, kpi }, rankIdx) => {
                                            const color = axisColorMap.get(ax.id) ?? AXIS_COLORS[0];
                                            const ach = kpi.ach ?? 0;
                                            const numVal = parseFloat(String(kpi.val ?? "0").replace(/[^0-9.]/g, "")) || 0;
                                            const barWidth = (numVal / maxNumericVal) * 100;

                                            return (
                                                <div key={ax.id} className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-300 w-4 shrink-0 text-right">{rankIdx + 1}</span>
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                    <span className="text-xs font-bold text-slate-700 w-24 shrink-0 truncate">{ax.name}</span>
                                                    <span className="text-xs font-black text-slate-600 w-20 shrink-0 text-right tabular-nums">{kpi.val}</span>
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-black tabular-nums w-10 shrink-0 text-right",
                                                        ach >= 100 ? "text-emerald-500" :
                                                        ach >= 80  ? "text-amber-500"  : "text-rose-500"
                                                    )}>
                                                        {ach}%
                                                    </span>
                                                </div>
                                            );
                                        })}
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

            {/* Block 3: AI 領域横断インサイト（2軸以上ある場合のみ表示） */}
            {axes.length >= 2 && (
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
            )}

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
