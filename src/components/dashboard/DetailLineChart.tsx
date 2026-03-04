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

    // 有効なデータ（> 0）のインデックスと値のみを抽出
    const validData = data.map((v, i) => ({ v, i })).filter(d => d.v > 0);

    const min = validData.length > 0 ? Math.min(...validData.map(d => d.v)) : 0;
    const max = validData.length > 0 ? Math.max(...validData.map(d => d.v)) : 5;
    const range = max - min || 1; // 0除算防止

    const points = validData.map((d) => {
        // X座標は元のインデックス (0~5) に基づいて配置（月がずれないようにする）
        const x = padding.left + (data.length > 1 ? (d.i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
        const y = padding.top + chartHeight - ((d.v - min) / range) * chartHeight;
        return { x, y };
    });

    const pathData = points.length > 0 ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") : "";
    const areaData = points.length > 0
        ? `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : "";

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
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

                {/* Last Point Marker */}
                {points.length > 0 && (
                    <circle
                        cx={points[points.length - 1].x}
                        cy={points[points.length - 1].y}
                        r={3}
                        fill={color}
                    />
                )}

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
