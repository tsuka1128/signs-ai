"use client";

/**
 * 体温 × KPI 時間ラグ相関チャート
 * pulse(t) と kpiAch(t+n) の散布図＋ピアソン相関係数を表示。
 * PHILOSOPHY.md § 1-4「先行指標」の実装。
 */

interface DeptData {
    pulseHistory: number[];
    kpiAchHistory: number[];
}

interface Props {
    depts: DeptData[];
    lag: number; // 何ヶ月先のKPIと相関させるか (1 or 2)
}

function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 3) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = Math.sqrt(
        xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
        ys.reduce((s, y) => s + (y - my) ** 2, 0)
    );
    return den === 0 ? 0 : num / den;
}

export function LagCorrelationChart({ depts, lag }: Props) {
    // 全部署の (pulse[t], kpiAch[t+lag]) ペアを収集
    const pairs: { x: number; y: number }[] = [];
    depts.forEach(d => {
        const maxT = 13 - 1 - lag;
        for (let t = 0; t <= maxT; t++) {
            const x = d.pulseHistory[t];
            const y = d.kpiAchHistory[t + lag];
            if (x > 0 && y > 0) pairs.push({ x, y });
        }
    });

    if (pairs.length < 3) {
        return (
            <div className="text-center py-8 text-[11px] text-slate-400 font-bold">
                データが不足しています（最低3ヶ月のデータが必要です）
            </div>
        );
    }

    const r = pearson(pairs.map(p => p.x), pairs.map(p => p.y));
    const rLabel = r >= 0.5 ? "強い正の相関" : r >= 0.3 ? "中程度の正の相関" : r <= -0.3 ? "負の相関" : "相関は弱い";
    const rColor = r >= 0.5 ? "#10B981" : r >= 0.3 ? "#F59E0B" : r <= -0.3 ? "#EF4444" : "#94A3B8";

    // SVGサイズ
    const W = 400; const H = 200;
    const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
    const minX = 1; const maxX = 5;
    const minY = 0; const maxY = 150;

    const toSvgX = (v: number) => PAD.left + ((v - minX) / (maxX - minX)) * (W - PAD.left - PAD.right);
    const toSvgY = (v: number) => H - PAD.bottom - ((v - minY) / (maxY - minY)) * (H - PAD.top - PAD.bottom);

    // 回帰直線
    const xs = pairs.map(p => p.x);
    const ys = pairs.map(p => p.y);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
                  xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 0;
    const intercept = my - slope * mx;
    const lineX1 = minX; const lineY1 = slope * lineX1 + intercept;
    const lineX2 = maxX; const lineY2 = slope * lineX2 + intercept;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    体温(t) → KPI達成率(t+{lag}ヶ月後) の相関
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black tabular-nums" style={{ color: rColor }}>
                        r = {r.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{rLabel}</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
                {/* 軸 */}
                <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#E2E8F0" strokeWidth={1} />
                <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#E2E8F0" strokeWidth={1} />
                {/* 軸ラベル */}
                <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="#94A3B8">体温スコア (t)</text>
                <text x={12} y={H / 2} textAnchor="middle" fontSize={9} fill="#94A3B8" transform={`rotate(-90, 12, ${H / 2})`}>KPI達成率 (t+{lag}ヶ月後)</text>
                {/* 回帰直線 */}
                <line
                    x1={toSvgX(lineX1)} y1={toSvgY(Math.max(minY, Math.min(maxY, lineY1)))}
                    x2={toSvgX(lineX2)} y2={toSvgY(Math.max(minY, Math.min(maxY, lineY2)))}
                    stroke={rColor} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7}
                />
                {/* 散布点 */}
                {pairs.map((p, i) => (
                    <circle
                        key={i}
                        cx={toSvgX(Math.max(minX, Math.min(maxX, p.x)))}
                        cy={toSvgY(Math.max(minY, Math.min(maxY, p.y)))}
                        r={4}
                        fill={rColor}
                        opacity={0.5}
                    />
                ))}
            </svg>
            <p className="text-[10px] text-slate-400 leading-relaxed">
                ※ 各点は「ある月の体温スコア」と「{lag}ヶ月後のKPI達成率」の組み合わせを表します。
                相関係数 r は -1〜1 の範囲で、1に近いほど体温が先行してKPIを予測する傾向を示します（相関であり因果ではありません）。
            </p>
        </div>
    );
}
