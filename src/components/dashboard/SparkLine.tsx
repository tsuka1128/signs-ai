"use client";

interface SparkLineProps {
    data: number[];
    color?: string;
    height?: number;
    width?: number;
}

export function SparkLine({ data, color = "#10B981", height = 50, width = 200 }: SparkLineProps) {
    const mn = Math.min(...data) * 0.95;
    const mx = Math.max(...data) * 1.05;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - mn) / (mx - mn)) * height;
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    const lastPoint = {
        x: width,
        y: height - ((data[data.length - 1] - mn) / (mx - mn)) * height
    };

    return (
        <div className="w-full" style={{ height }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#areaGradient)" />
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} className="animate-pulse" />
            </svg>
        </div>
    );
}
