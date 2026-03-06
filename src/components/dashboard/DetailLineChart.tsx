"use client";

interface DetailLineChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
}

export function DetailLineChart({ data, labels, color = "#10B981", height = 140 }: DetailLineChartProps) {
    const width = 600;
    const padding = { top: 20, right: 30, bottom: 35, left: 30 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 全データポイント（0も含む）を描画対象とする
    const min = 0;
    const max = Math.max(...data, 5); // 最低でも5を上限として見やすく
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

    // ラベルが多すぎる場合に間引く（12ヶ月などの場合、1つおきに表示）
    const shouldSkipLabel = labels.length > 8;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#F1F5F9" strokeWidth={1} />

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
                        r={p.v > 0 ? 4 : 2}
                        fill={p.v > 0 ? color : "#CBD5E1"}
                        className="transition-all duration-300"
                    />
                ))}

                {/* X-Axis Labels - 重なりを防ぐための間引きロジック */}
                {labels.map((label, i) => {
                    // ラベル数が多い場合、偶数番目のみ表示、あるいは最初と最後を考慮して間引く
                    if (shouldSkipLabel && i % 2 !== 0 && i !== labels.length - 1) return null;

                    const xPos = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : 0.5 * chartWidth);
                    return (
                        <text
                            key={i}
                            x={xPos}
                            y={height - 8}
                            textAnchor="middle"
                            className="text-[11px] fill-slate-400 font-bold select-none"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
