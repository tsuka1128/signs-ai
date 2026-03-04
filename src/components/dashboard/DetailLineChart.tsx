"use client";

interface DetailLineChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
}

export function DetailLineChart({ data, labels, color = "#10B981", height = 120 }: DetailLineChartProps) {
    const width = 600;
    const padding = { top: 15, right: 15, bottom: 20, left: 15 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 全データポイント（0も含む）を描画対象とする
    const min = 0;
    const max = Math.max(...data, 5); // 最低でも5を上限として見やすく
    const range = max - min || 1; // 0除算防止

    // 全月分の座標を計算（0値も底部に描画）
    const points = data.map((v, i) => {
        const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
        const y = padding.top + chartHeight - ((v - min) / range) * chartHeight;
        return { x, y, v };
    });

    const pathData = points.length > 0 ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") : "";
    const areaData = points.length > 0
        ? `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : "";

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area */}
                <path d={areaData} fill="url(#chartGradient)" />

                {/* Line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* 各月のデータポイントを描画（0の月は小さく表示） */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={p.v > 0 ? 3 : 2}
                        fill={p.v > 0 ? color : "#CBD5E1"}
                    />
                ))}

                {/* X-Axis Labels */}
                {labels.map((label, i) => {
                    const xPos = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
                    return (
                        <text
                            key={i}
                            x={xPos}
                            y={height - 2}
                            textAnchor="middle"
                            className="text-[10px] fill-slate-400 font-medium"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
