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

    const min = Math.min(...data) * 0.95;
    const max = Math.max(...data) * 1.05;
    const range = max - min;

    const points = data.map((v, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((v - min) / range) * chartHeight;
        return { x, y };
    });

    const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const areaData = `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

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
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r={3}
                    fill={color}
                />

                {/* X-Axis Labels */}
                {labels.map((label, i) => (
                    <text
                        key={i}
                        x={points[i].x}
                        y={height - 2}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-400 font-medium"
                    >
                        {label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
