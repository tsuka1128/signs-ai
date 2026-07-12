"use client";

import { useState, useRef } from "react";
import { calcKpiQuality, KPI_QUALITY_META, PULSE_GOOD_THRESHOLD, PULSE_WATCH_THRESHOLD } from "@/lib/logic/kpi-engine";

interface DetailLineChartProps {
    data: number[];
    targetData?: number[];
    labels: string[];
    fullLabels?: string[];
    unit?: string;
    color?: string;
    height?: number;
    pulseHistory?: number[];
    /** true のとき値0の月を「未計測」として線を切る（体温/偏差など。KPIでは0が正当値なので既定false） */
    gapAtZero?: boolean;
}

export function DetailLineChart({
    data,
    targetData = [],
    labels,
    fullLabels = [],
    unit = "",
    color = "#10B981",
    height = 140,
    pulseHistory = [],
    gapAtZero = false,
}: DetailLineChartProps) {
    const width = 600;
    const padding = { top: 20, right: 30, bottom: 35, left: 30 };
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 全データポイント（0も含む）を描画対象とする
    const min = 0;
    const dataMax = data.length > 0 ? Math.max(...data.map(v => v || 0)) : 0;
    const targetMax = targetData.length > 0 ? Math.max(...targetData.map(v => v || 0)) : 0;
    const max = Math.max(dataMax, targetMax, 5);
    const range = max - min || 1;

    // 全月分の座標を計算（gapAtZero のとき v<=0 は「未計測」= gap 扱い）
    const baseY = padding.top + chartHeight;
    const points = data.map((v, i) => {
        const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
        const y = baseY - ((v - min) / range) * chartHeight;
        const gap = gapAtZero && (v == null || v <= 0);
        return { x, y, v, gap };
    });

    let pathData = "";
    let areaData = "";
    if (gapAtZero) {
        // 未計測月で線・エリアを分断する（床を這って急騰する見え方を防ぐ／connectNulls相当）
        const lineSeg: string[] = [];
        let started = false;
        points.forEach((p) => {
            if (p.gap) { started = false; return; }
            lineSeg.push(started ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`);
            started = true;
        });
        pathData = lineSeg.join(" ");

        // エリアは連続した計測区間ごとに閉じる
        let seg: { x: number; y: number }[] = [];
        const flush = () => {
            if (seg.length > 0) {
                const d = seg.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
                areaData += `${d} L ${seg[seg.length - 1].x} ${baseY} L ${seg[0].x} ${baseY} Z `;
                seg = [];
            }
        };
        points.forEach((p) => { if (p.gap) flush(); else seg.push({ x: p.x, y: p.y }); });
        flush();
    } else {
        pathData = points.length > 0 ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") : "";
        areaData = points.length > 0
            ? `${pathData} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
            : "";
    }

    // 目標ラインの座標を計算
    const targetPoints = targetData.map((v, i) => {
        if (v == null || v === 0) return null;
        const x = padding.left + (targetData.length > 1 ? (i / (targetData.length - 1)) * chartWidth : 0.5 * chartWidth);
        const y = padding.top + chartHeight - ((v - min) / range) * chartHeight;
        return { x, y, v };
    });

    const hasTargetLine = targetPoints.some(p => p !== null);
    const targetPathSegments: string[] = [];
    let segmentStart = true;
    targetPoints.forEach((p) => {
        if (p === null) {
            segmentStart = true;
        } else {
            targetPathSegments.push(segmentStart ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`);
            segmentStart = false;
        }
    });
    const targetPathData = targetPathSegments.join(" ");

    // ラベルが多すぎる場合に間引く
    const shouldSkipLabel = labels.length > 8;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * width;

        // 最も近いデータポイントのインデックスを特定
        let closestIndex = 0;
        let minDistance = Infinity;

        points.forEach((p, i) => {
            const distance = Math.abs(p.x - mouseX);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        });

        // 一定距離内であればホバー状態にする
        if (minDistance < (chartWidth / data.length)) {
            setHoveredIndex(closestIndex);
        } else {
            setHoveredIndex(null);
        }
    };

    // ツールチップの表示位置（右端の場合は左側に寄せる）
    const isRightSide = hoveredIndex !== null && hoveredIndex > data.length * 0.7;

    return (
        <div
            ref={containerRef}
            className="w-full relative group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#F1F5F9" strokeWidth={1} />

                {/* 体温ヒートマップ（月ごとの背景色） */}
                {pulseHistory.length > 0 && pulseHistory.map((pulse, mi) => {
                    if (pulse <= 0) return null;
                    const x = padding.left + (pulseHistory.length > 1 ? (mi / (pulseHistory.length - 1)) * chartWidth : 0.5 * chartWidth);
                    const barW = chartWidth / Math.max(1, pulseHistory.length - 1);
                    
                    // 背景色の選定
                    const bgColor = pulse >= PULSE_GOOD_THRESHOLD ? "#D1FAE5"  // 緑: 高体温
                                  : pulse >= PULSE_WATCH_THRESHOLD ? "#FEF9C3"  // 黄: 普通
                                  : "#FEE2E2";                 // 赤: 低体温
                    
                    return (
                        <rect
                            key={mi}
                            x={x - barW/2} y={padding.top} width={barW} height={chartHeight}
                            fill={bgColor} opacity={0.35}
                        />
                    );
                })}

                {/* Hover Vertical Line */}
                {hoveredIndex !== null && (
                    <line
                        x1={points[hoveredIndex].x}
                        y1={padding.top}
                        x2={points[hoveredIndex].x}
                        y2={padding.top + chartHeight}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                )}

                {/* Area */}
                <path d={areaData} fill="url(#chartGradient)" />

                {/* Target Line */}
                {hasTargetLine && (
                    <path
                        d={targetPathData}
                        fill="none"
                        stroke="#CBD5E1"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.8}
                    />
                )}

                {/* Line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* 各月のデータポイントを描画（gapAtZero のとき未計測月はマーカーも出さない） */}
                {points.map((p, i) => (
                    p.gap ? null : (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIndex === i ? 6 : (p.v > 0 ? 4 : 2)}
                            fill={hoveredIndex === i ? color : (p.v > 0 ? color : "#CBD5E1")}
                            stroke="white"
                            strokeWidth={hoveredIndex === i ? 2 : 0}
                            className="transition-all duration-200"
                        />
                    </g>
                    )
                ))}

                {/* X-Axis Labels */}
                {labels.map((label, i) => {
                    const isLast = i === labels.length - 1;
                    const isEveryThird = i % 3 === 0;
                    if (shouldSkipLabel && !isEveryThird && !isLast) return null;

                    const xPos = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
                    return (
                        <text
                            key={i}
                            x={xPos}
                            y={height - 8}
                            textAnchor="middle"
                            className="text-[10px] fill-slate-400 font-bold select-none"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 ml-1">
                {hasTargetLine && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-bold text-slate-400">実績</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg width="16" height="2" viewBox="0 0 16 2">
                                <line x1="0" y1="1" x2="16" y2="1" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 3" />
                            </svg>
                            <span className="text-[10px] font-bold text-slate-400">目標</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                    </>
                )}
                {/* 背景ヒートマップの凡例（体温データがある場合のみ） */}
                {pulseHistory.some(p => p > 0) && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200 opacity-80" />
                            <span className="text-[10px] font-bold text-slate-400">高体温 (≥3.8)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-200 opacity-80" />
                            <span className="text-[10px] font-bold text-slate-400">標準 (≥3.0)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-rose-100 border border-rose-200 opacity-80" />
                            <span className="text-[10px] font-bold text-slate-400">低体温 (&lt;3.0)</span>
                        </div>
                    </>
                )}
            </div>

            {/* Tooltip */}
            {hoveredIndex !== null && (
                <div
                    className={`absolute z-50 bg-white border border-slate-100 shadow-xl rounded-xl p-3 pointer-events-none transform mb-4 min-w-[120px] transition-all duration-150
                        ${isRightSide ? "-translate-x-[105%] -translate-y-full" : "-translate-x-1/2 -translate-y-full"}`}
                    style={{
                        left: `${(points[hoveredIndex].x / width) * 100}%`,
                        top: `${(points[hoveredIndex].y / height) * 100}%`
                    }}
                >
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 border-b border-slate-50 pb-1">
                        {fullLabels[hoveredIndex] || labels[hoveredIndex]}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold">実績</span>
                            <span className="text-xs font-black text-slate-800">
                                {(data[hoveredIndex] || 0).toLocaleString()}<span className="text-[10px] ml-0.5 font-bold text-slate-400">{unit}</span>
                            </span>
                        </div>
                        {targetData[hoveredIndex] != null && (
                            <>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-[10px] text-slate-500 font-bold">目標</span>
                                    <span className="text-xs font-black text-slate-800">
                                        {(targetData[hoveredIndex] || 0).toLocaleString()}<span className="text-[10px] ml-0.5 font-bold text-slate-400">{unit}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-500 font-bold">達成率</span>
                                    <span className={`text-xs font-black ${(data[hoveredIndex] || 0) >= (targetData[hoveredIndex] || 0) ? "text-emerald-500" : "text-rose-500"}`}>
                                        {(targetData[hoveredIndex] || 0) > 0 ? Math.round(((data[hoveredIndex] || 0) / (targetData[hoveredIndex] || 0)) * 100) : 0}%
                                    </span>
                                </div>
                                {pulseHistory[hoveredIndex] > 0 && (
                                    <div className="flex justify-between items-center gap-3 pt-1 mt-1 border-t border-slate-50">
                                        <span className="text-[9px] text-slate-400 font-bold">コンディション</span>
                                        {(() => {
                                            const ach = targetData[hoveredIndex] ? ((data[hoveredIndex] || 0) / (targetData[hoveredIndex] || 0)) * 100 : 0;
                                            const pulse = pulseHistory[hoveredIndex];
                                            const quality = calcKpiQuality(ach, pulse);
                                            const meta = KPI_QUALITY_META[quality];
                                            return (
                                                <span className={`text-[10px] font-black ${meta.color}`}>
                                                    {meta.icon} {meta.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
