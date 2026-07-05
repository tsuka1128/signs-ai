"use client";

import { memo, useId } from "react";

interface SparkLineProps {
    data: number[];
    color?: string;
    height?: number;
    width?: number;
}

function SparkLineImpl({ data, color = "#10B981", height = 50, width = 200 }: SparkLineProps) {
    // gradient id を一意化（従来は "areaGradient" 固定で、同一ページ内の全 SparkLine が衝突していた）
    const gradientId = useId();

    // データが無ければ描画しない（Math.min(...[]) が Infinity になり NaN 座標を生むのを防ぐ）
    if (!data || data.length === 0) {
        return <div className="w-full" style={{ height }} />;
    }

    const mn = Math.min(...data) * 0.95;
    const mx = Math.max(...data) * 1.05;
    // 全値が同じ（例: 全月0でフラット）だと mx-mn=0 で 0除算→NaN→線が消える。中央水平線を描く。
    const range = mx - mn;
    const yFor = (v: number) => (range === 0 ? height / 2 : height - ((v - mn) / range) * height);
    // 単一点のとき i/(length-1) が 0/0=NaN になるのを防ぐ
    const denomX = data.length > 1 ? data.length - 1 : 1;

    const points = data.map((v, i) => {
        const x = (i / denomX) * width;
        const y = yFor(v);
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    const lastPoint = {
        x: width,
        y: yFor(data[data.length - 1])
    };

    return (
        <div className="w-full" style={{ height }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill={`url(#${gradientId})`} />
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

export const SparkLine = memo(SparkLineImpl);
