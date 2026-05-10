"use client";

import { useState, useRef } from "react";

interface DetailLineChartProps {
    data: number[];
    targetData?: number[];
    labels: string[];
    fullLabels?: string[];
    unit?: string;
    color?: string;
    height?: number;
    pulseHistory?: number[];
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

    // 全月分の座標を計算
    const points = data.map((v, i) => {
        const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
        const y = padding.top + chartHeight - ((v - min) / range) * chartHeight;
        return { x, y, v };
    });

    const pathData = points.length > 0 ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") : "";
    const areaData = points.length > 0
        ? `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : "";

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
                    const bgColor = pulse >= 3.8 ? "#D1FAE5"  // 緑: 高体温
                                  : pulse >= 3.0 ? "#FEF9C3"  // 黄: 普通
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

                {/* 各月のデータポイントを描画 */}
                {points.map((p, i) => {
                    const pulse = pulseHistory[i] ?? 0;
                    const achRate = targetData[i] ? (p.v / targetData[i]) * 100 : 0;
                    // 焼き付き達成判定: 達成率80%以上 かつ 体温3.5未満
                    const isBurnout = achRate >= 80 && pulse > 0 && pulse < 3.5;

                    return (
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
                            {isBurnout && (
                                <text 
                                    x={p.x} y={p.y - 12} 
                                    textAnchor="middle" 
                                    className="text-[10px] animate-bounce select-none"
                                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                                >
                                    ⚠️
                                </text>
                            )}
                        </g>
                    );
                })}

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

            {hasTargetLine && (
                <div className="flex items-center gap-4 mt-1 ml-1">
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
                </div>
            )}

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
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
