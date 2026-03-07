"use client";

import { useMemo, useState } from "react";

interface ScatterData {
    id: string;
    name: string;
    head: number;
    productivity: number;
    pulse: number;
    weather: "sun" | "cloud" | "rain";
    kpiAch: number;
    kpiName?: string;
    prevHead?: number;
    prevProductivity?: number;
    mrr?: number;
    sizeValue?: number; // 追加
}

interface ScatterPlotProps {
    data: ScatterData[];
    isProduct?: boolean;
    sizeKpiName?: string; // 追加
    month?: string;
    onMonthChange?: (val: string) => void;
    onProductToggle?: (isProduct: boolean) => void;
}

export function ScatterPlot({ data, isProduct = false, sizeKpiName = "KPI達成率", month, onMonthChange, onProductToggle }: ScatterPlotProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const W = 680;
    const H = 680; // 正方形に固定
    const PAD = { t: 60, r: 60, b: 80, l: 60 };
    const pw = W - PAD.l - PAD.r;
    const ph = H - PAD.t - PAD.b;

    const { maxH, maxY } = useMemo(() => {
        const hValues = data.map((d) => d.head);
        const yValues = data.map((d) => d.productivity);
        const maxH = hValues.length > 0 ? Math.max(...hValues, 10) * 1.5 : 50;
        const maxY = yValues.length > 0 ? Math.max(...yValues, 10) * 1.5 : 200;
        return { maxH, maxY };
    }, [data]);

    const midX = PAD.l + pw / 2;
    const midY = PAD.t + ph / 2;

    // 円やラベルが外枠に被らないように、描画領域を内側 80% に縮小（上下左右に 10% のマージン）
    const innerW = pw * 0.8;
    const innerH = ph * 0.8;
    const offsetX = pw * 0.1;
    const offsetY = ph * 0.1;

    const cx = (h: number) => PAD.l + offsetX + Math.max(0, Math.min(1, h / maxH)) * innerW;
    const cy = (val: number) => PAD.t + ph - offsetY - Math.max(0, Math.min(1, val / maxY)) * innerH;

    const yLabelWord = "高生産性";
    const yLabelWordLow = "低生産性";

    const quads = [
        { x: PAD.l, y: PAD.t, w: pw / 2, h: ph / 2, label: "PIONEER (開拓者)", sub: `少人数×${yLabelWord} | 理想的な自律型・高効率チーム`, color: "#ECFDF5", emoji: "⭐" },
        { x: midX, y: PAD.t, w: pw / 2, h: ph / 2, label: "SCALE (拡大期)", sub: `多人数×${yLabelWord} | 組織の成果を牽引する主力部隊`, color: "#EFF6FF", emoji: "📈" },
        { x: PAD.l, y: midY, w: pw / 2, h: ph / 2, label: "SEED (種まき)", sub: `少人数×${yLabelWordLow} | 新規事業・R&Dなどの投資フェーズ`, color: "#FFFBEB", emoji: "🌱" },
        { x: midX, y: midY, w: pw / 2, h: ph / 2, label: "OVERWEIGHT (肥大化)", sub: `多人数×${yLabelWordLow} | 調整コスト増大による改善必須領域`, color: "#FFF1F2", emoji: "⚠️" }
    ];

    const colors = {
        sun: "#10B981",
        cloud: "#F59E0B",
        rain: "#EF4444",
        gray: "#94A3B8",
        dark: "#1E293B"
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const renderChart = () => (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto font-sans select-none relative">
            {/* Quadrants */}
            {quads.map((q, i) => (
                <g key={i}>
                    <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} />
                    <text x={q.x + 12} y={q.y + 24} className="text-[10px] fill-slate-500 font-bold uppercase tracking-tight">{q.emoji} {q.label}</text>
                    <text x={q.x + 12} y={q.y + 38} className="text-[9px] fill-slate-400 font-medium">{q.sub}</text>
                </g>
            ))}

            {/* Axis Lines */}
            <line x1={midX} y1={PAD.t} x2={midX} y2={PAD.t + ph} stroke={colors.gray} strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
            <line x1={PAD.l} y1={midY} x2={PAD.l + pw} y2={midY} stroke={colors.gray} strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />

            {/* Data Points */}
            {[...data].filter(d => d.pulse > 0).sort((a, b) => (a.id === hoveredId ? 1 : b.id === hoveredId ? -1 : 0)).map((d, i) => {
                const x = cx(d.head);
                const y = cy(d.productivity);

                // 円の半径を計算
                let r = Math.max(12, Math.min(48, (d.kpiAch / 100) * 20));

                if (isProduct) {
                    // sizeValue があれば優先使用。なければ mrr や kpiAch
                    const valForSize = d.sizeValue !== undefined ? d.sizeValue : (d.mrr || d.kpiAch || 100);
                    r = Math.max(12, Math.min(48, (valForSize / 100) * 20));

                    // 特例: 全くデータがない（初期値100）の場合のみ、所属人数の規模に応じて少し大きくする
                    if (valForSize === 100 && d.kpiAch === 100 && d.head > 0) {
                        r = Math.max(16, Math.min(50, (d.head / 10) * 5));
                    }
                }

                const col = d.weather === "sun" ? colors.sun : d.weather === "rain" ? colors.rain : colors.cloud;

                const isAchieved = d.kpiAch >= 100;

                return (
                    <g
                        key={d.id || i}
                        className="transition-transform duration-1000 ease-in-out cursor-pointer group"
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                        onMouseEnter={() => setHoveredId(d.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* ホバー用ヒットエリア */}
                        <circle cx={0} cy={0} r={r + 20} fill="transparent" />

                        <circle
                            cx={0} cy={0} r={r}
                            fill={col} opacity={0.15}
                            stroke={col} strokeWidth={1.5}
                            className="transition-all duration-300 ease-in-out group-hover:opacity-40"
                        />
                        {isAchieved && (
                            <circle
                                cx={0} cy={0} r={4}
                                fill={col}
                                className="animate-ping opacity-75"
                                style={{ transformOrigin: "0px 0px" }}
                            />
                        )}
                        <circle cx={0} cy={0} r={4} fill={col} />

                        {/* 部署名 / プロダクト名 背景とテキスト */}
                        <rect x={-40} y={-r - 32} width={80} height={14} rx={3} fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <text x={0} y={-r - 22} textAnchor="middle" className="text-[11px] font-black fill-slate-800 tracking-tight transition-all duration-1000 ease-in-out pointer-events-none">{d.name}</text>

                        {/* KPI 背景とテキスト */}
                        {!isProduct && (
                            <>
                                <rect x={-40} y={-r - 18} width={80} height={12} rx={3} fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <text x={0} y={-r - 10} textAnchor="middle" className="text-[9px] fill-slate-500 font-bold transition-all duration-1000 ease-in-out pointer-events-none">KPI: {d.kpiName || `${d.kpiAch}%`}</text>
                            </>
                        )}

                        {/* 体温 背景とテキスト */}
                        <rect x={-30} y={r + 5} width={60} height={12} rx={3} fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <text x={0} y={r + 14} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold transition-all duration-1000 ease-in-out pointer-events-none">体温 {d.pulse.toFixed(1)}</text>

                        {/* ホバー時リング */}
                        <circle cx={0} cy={0} r={r + 4} fill="none" stroke={col} strokeWidth={1.5} className="opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none" strokeDasharray="3,2" />
                    </g>
                );
            })}

            {/* Labels */}
            <text x={W / 2} y={H - 55} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold uppercase tracking-widest">人数（リソース） →</text>

            <g transform={`rotate(-90,12,${H / 2 - 25}) translate(12, ${H / 2 - 25})`}>
                <text x={0} y={0} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold uppercase tracking-widest">一人当たり生産性 →</text>
                <g className="cursor-help group/axis-help">
                    <circle cx={65} cy={-3} r={6} fill="#F1F5F9" className="group-hover/axis-help:fill-slate-200 transition-colors" />
                    <text x={65} y={0} textAnchor="middle" className="text-[8px] font-black fill-slate-500">?</text>
                    <title>一人当たり生産性 = KPI達成率 × 体温係数</title>
                </g>
            </g>

            {/* Legend */}
            <g transform={`translate(${W / 2 - 160}, ${H - 25})`}>
                <circle cx={0} cy={0} r={4} fill={colors.sun} opacity={0.3} stroke={colors.sun} strokeWidth={1} />
                <circle cx={0} cy={0} r={1.5} fill={colors.sun} />
                <text x={10} y={4} className="text-[9px] fill-slate-400 font-bold">☀️ 体温良好</text>

                <circle cx={80} cy={0} r={4} fill={colors.cloud} opacity={0.3} stroke={colors.cloud} strokeWidth={1} />
                <circle cx={80} cy={0} r={1.5} fill={colors.cloud} />
                <text x={90} y={4} className="text-[9px] fill-slate-400 font-bold">☁️ 要注意</text>

                <circle cx={160} cy={0} r={4} fill={colors.rain} opacity={0.3} stroke={colors.rain} strokeWidth={1} />
                <circle cx={160} cy={0} r={1.5} fill={colors.rain} />
                <text x={170} y={4} className="text-[9px] fill-slate-400 font-bold">☔️ 危険域</text>

                <g transform="translate(240, 0)">
                    <circle cx={0} cy={0} r={4} fill={colors.gray} className="animate-ping opacity-75" style={{ transformOrigin: "0px 0px" }} />
                    <circle cx={0} cy={0} r={4} fill={colors.gray} />
                    <text x={10} y={4} className="text-[9px] fill-slate-400 font-bold">波紋: KPI達成</text>
                </g>
            </g>
        </svg>
    );

    return (
        <>
            {/* 通常表示パターン（スマホ・PC共通で画面幅に収まる） */}
            <div className="w-full bg-white rounded-xl border border-slate-100 shadow-sm relative">
                <div className="p-2 pb-4 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    {renderChart()}
                </div>

                {/* 拡大案内ボタン（スマホ等のタッチ操作向けにも常時表示） */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 p-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-[10px] font-bold z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    拡大表示
                </button>
            </div>

            {/* ライトボックス（モーダル）表示 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 relative shadow-2xl touch-pan-y" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 px-1">部署 / プロダクト マトリックス 詳細</h3>
                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 px-1 uppercase tracking-tight">
                                        <div className="flex items-center gap-1">
                                            <span>縦軸: 一人当たり生産性</span>
                                            <div className="relative group/calc">
                                                <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors">?</button>
                                                <div className="absolute top-full left-0 mt-2 w-56 md:w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block group-focus-within/calc:block z-[400] normal-case tracking-normal transition-all animate-in fade-in zoom-in-95">
                                                    <div className="font-bold text-white mb-2 flex items-center gap-1.5"><span className="text-sm">📉</span>生産性スコアの計算式</div>
                                                    <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[10px] text-emerald-400 mb-2.5 border border-slate-700">
                                                        主担当KPIの達成率 × 体温係数
                                                    </div>
                                                    <div className="text-slate-300">
                                                        ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化。<br />
                                                        そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、バックオフィスを含む全社のチームを同列のY軸で比較評価します。
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <span>｜ 横軸: {isProduct ? "所属人数" : "リソース量"} ｜ 円サイズ: {sizeKpiName}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-slate-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            {/* 操作パネル（プロパティが渡されている場合のみ表示） */}
                            {(onProductToggle || onMonthChange) && (
                                <div className="flex flex-wrap items-center gap-4 px-1">
                                    {onProductToggle && (
                                        <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold cursor-pointer">
                                            <button onClick={() => onProductToggle(false)} className={`px-4 py-1.5 rounded-full transition-colors ${!isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>部署別</button>
                                            <button onClick={() => onProductToggle(true)} className={`px-4 py-1.5 rounded-full transition-colors ${isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>プロダクト別</button>
                                        </div>
                                    )}
                                    {onMonthChange && (
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:inline ml-2">Time Lapse</span>
                                            <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold cursor-pointer">
                                                {[{ id: "default", label: "現在" }, { id: "1m", label: "1ヶ月前" }, { id: "3m", label: "3ヶ月前" }, { id: "6m", label: "6ヶ月前" }, { id: "12m", label: "1年前" }].map((t) => (
                                                    <button key={t.id} onClick={() => onMonthChange(t.id)} className={`px-3 py-1.5 rounded-full transition-colors ${(month || "default") === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>{t.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-full mx-auto" style={{ minWidth: 'min(100%, 640px)' }}>
                            {renderChart()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
