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
}

export function DetailLineChart({
    data,
    targetData = [],
    labels,
    fullLabels = [],
    unit = "",
    color = "#10B981",
    height = 140
}: DetailLineChartProps) {
    const width = 600;
    const padding = { top: 20, right: 30, bottom: 35, left: 30 };
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 全データポイント（0も含む）を描画対象とする
    const min = 0;
    const dataMax = data.length > 0 ? Math.max(...data) : 0;
    const targetMax = targetData.length > 0 ? Math.max(...targetData) : 0;
    const max = Math.max(dataMax, targetMax, 5); // 最低でも5を上限として見やすく
    const range = max - min || 1; // 0除算防止

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
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 6 : (p.v > 0 ? 4 : 2)}
                        fill={hoveredIndex === i ? color : (p.v > 0 ? color : "#CBD5E1")}
                        stroke="white"
                        strokeWidth={hoveredIndex === i ? 2 : 0}
                        className="transition-all duration-200"
                    />
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
                                {data[hoveredIndex].toLocaleString()}<span className="text-[10px] ml-0.5 font-bold text-slate-400">{unit}</span>
                            </span>
                        </div>
                        {targetData[hoveredIndex] !== undefined && (
                            <>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-[10px] text-slate-500 font-bold">目標</span>
                                    <span className="text-xs font-black text-slate-800">
                                        {targetData[hoveredIndex].toLocaleString()}<span className="text-[10px] ml-0.5 font-bold text-slate-400">{unit}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-500 font-bold">達成率</span>
                                    <span className={`text-xs font-black ${data[hoveredIndex] >= targetData[hoveredIndex] ? "text-emerald-500" : "text-rose-500"}`}>
                                        {targetData[hoveredIndex] > 0 ? Math.round((data[hoveredIndex] / targetData[hoveredIndex]) * 100) : 0}%
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
