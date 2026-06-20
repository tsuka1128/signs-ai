"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Thermometer, Target, Shield, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/index";

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
    mrr?: number;
    sizeValue?: number;
    respondentsCount?: number;
    masterHeadcount?: number;
    hasKpiData?: boolean;
}

interface ScatterPlotProps {
    data: ScatterData[];
    isProduct?: boolean;
    sizeKpiName?: string;
    yAxisMode: "kpi" | "productivity";
}

export function ScatterPlot({ data, isProduct = false, sizeKpiName = "KPI達成率", yAxisMode }: ScatterPlotProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const W = 680;
    const H = 680; // 正方形に固定
    const PAD = { t: 60, r: 60, b: 80, l: 60 };
    const pw = W - PAD.l - PAD.r;
    const ph = H - PAD.t - PAD.b;

    // X軸は人数（規模）、Y軸は指定されたモード（KPI達成率または一人当たり生産性）
    const { maxH, maxY } = useMemo(() => {
        const hValues = data.map((d) => d.head);
        const yValues = data.map((d) => yAxisMode === "kpi" ? d.kpiAch : d.productivity);
        
        const maxH = hValues.length > 0 ? Math.max(...hValues, 10) * 1.3 : 50;
        
        // Y軸がKPI達成率なら最低100%を上限とする。生産性の場合は最低10を上限とする。
        const defaultMaxY = yAxisMode === "kpi" ? 100 : 10;
        const maxY = yValues.length > 0 ? Math.max(...yValues, defaultMaxY) * 1.2 : 120;
        
        return { maxH, maxY };
    }, [data, yAxisMode]);

    const midX = PAD.l + pw / 2;
    const midY = PAD.t + ph / 2;

    // 描画マージン
    const innerW = pw * 0.8;
    const innerH = ph * 0.8;
    const offsetX = pw * 0.1;
    const offsetY = ph * 0.1;

    const cx = (h: number) => PAD.l + offsetX + Math.max(0, Math.min(1, h / maxH)) * innerW;
    const cy = (val: number) => PAD.t + ph - offsetY - Math.max(0, Math.min(1, val / maxY)) * innerH;

    const yLabelWord = yAxisMode === "kpi" ? "高達成" : "高生産性";
    const yLabelWordLow = yAxisMode === "kpi" ? "低達成" : "低生産性";

    // 4象限の定義（極薄・彩度低の目に優しいトーン）
    const quads = [
        { x: PAD.l, y: PAD.t, w: pw / 2, h: ph / 2, label: "PIONEER (開拓者)", sub: `少人数×${yLabelWord} | 少数高効率`, color: "#F4FBF7" }, // 極薄グリーン
        { x: midX, y: PAD.t, w: pw / 2, h: ph / 2, label: "SCALE (拡大期)", sub: `多人数×${yLabelWord} | 主力エンジン`, color: "#F5F9FD" },  // 極薄ブルー
        { x: PAD.l, y: midY, w: pw / 2, h: ph / 2, label: "SEED (種まき)", sub: `少人数×${yLabelWordLow} | 立ち上げ期`, color: "#FCFAF2" },   // 極薄イエロー
        { x: midX, y: midY, w: pw / 2, h: ph / 2, label: "OVERWEIGHT (要テコ入れ)", sub: `多人数×${yLabelWordLow} | 改善必須領域`, color: "#FDF5F5" } // 極薄レッド
    ];

    // 体温4状態の配色（落ち着いたトーン）
    const colors = {
        sun: "#059669",    // 落ち着いたエメラルド
        cloud: "#D97706",  // 落ち着いたアンバー
        rain: "#DC2626",   // 落ち着いたローズ/レッド
        gray: "#64748B",   // スレートグレー
        lightGray: "#CBD5E1",
        gridLine: "#E2E8F0"
    };
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showAxisHelp, setShowAxisHelp] = useState(false);
    
    useEffect(() => { setMounted(true); }, []);

    const renderChart = () => (
        <div className="relative w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto font-sans select-none relative">
                {/* 象限の背景 */}
                {quads.map((q, i) => (
                    <g key={i}>
                        <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} />
                        <text x={q.x + 12} y={q.y + 20} className="text-[9px] fill-slate-500 font-black tracking-widest uppercase">{q.label}</text>
                        <text x={q.x + 12} y={q.y + 32} className="text-[8px] fill-slate-400 font-bold">{q.sub}</text>
                    </g>
                ))}

                {/* グリッド境界線 (細い) */}
                <line x1={midX} y1={PAD.t} x2={midX} y2={PAD.t + ph} stroke={colors.lightGray} strokeWidth={1} strokeDasharray="3,3" opacity={0.6} />
                <line x1={PAD.l} y1={midY} x2={PAD.l + pw} y2={midY} stroke={colors.lightGray} strokeWidth={1} strokeDasharray="3,3" opacity={0.6} />

                {/* 外枠 */}
                <rect x={PAD.l} y={PAD.t} width={pw} height={ph} fill="none" stroke="#E2E8F0" strokeWidth={1.5} />

                {/* データプロット */}
                {[...data].sort((a, b) => (a.id === hoveredId ? 1 : b.id === hoveredId ? -1 : 0)).map((d, i) => {
                    const x = cx(d.head);
                    const y = cy(yAxisMode === "kpi" ? d.kpiAch : d.productivity);

                    // サイズ判定：人件費重視の時のみ可変、他は12px均一
                    let r = 12;
                    if (sizeKpiName === "人件費の大きさ" && d.sizeValue) {
                        r = Math.max(12, Math.min(32, 12 + (d.sizeValue / 5000) * 8));
                    }

                    const hasEnoughResponses = d.respondentsCount !== undefined ? d.respondentsCount >= 1 : d.pulse > 0;
                    const isGrayOut = !hasEnoughResponses || d.pulse === 0;
                    const col = isGrayOut ? colors.gray : (d.weather === "sun" ? colors.sun : d.weather === "rain" ? colors.rain : colors.cloud);

                    return (
                        <g
                            key={d.id || i}
                            className="transition-all duration-500 ease-in-out cursor-pointer group"
                            style={{ 
                                transform: `translate(${x}px, ${y}px)`,
                                opacity: hoveredId ? (d.id === hoveredId ? 1 : 0.3) : 1
                            }}
                            onMouseEnter={() => setHoveredId(d.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* ヒットエリア */}
                            <circle cx={0} cy={0} r={r + 15} fill="transparent" />

                            {/* 外枠バブル (半透明) */}
                            <circle
                                cx={0} cy={0} r={r}
                                fill={col} opacity={d.hasKpiData === false ? 0.05 : 0.15}
                                stroke={col} strokeWidth={1.5}
                                strokeDasharray={d.hasKpiData === false ? "3,3" : "0"}
                                className="transition-all duration-300 ease-in-out group-hover:opacity-40"
                            />

                            {/* 中心点ドット */}
                            <circle cx={0} cy={0} r={3} fill={col} />

                            {/* ホバー時外枠リング */}
                            <circle cx={0} cy={0} r={r + 4} fill="none" stroke={col} strokeWidth={1.5} className="opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none" strokeDasharray="3,2" />
                        </g>
                    );
                })}

                {/* 軸ラベル */}
                <text x={W / 2} y={H - 45} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold uppercase tracking-widest">人数 (所属リソース) →</text>

                <g transform={`rotate(-90,15,${H / 2 - 25}) translate(15, ${H / 2 - 25})`}>
                    <text x={0} y={0} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold uppercase tracking-widest">
                        {yAxisMode === "kpi" ? "KPI達成率 (%) →" : "一人当たり生産性 →"}
                    </text>
                    {yAxisMode === "productivity" && (
                        <text x={0} y={10} textAnchor="middle" className="text-[7px] fill-slate-300 font-bold">
                            (KPI達成率 × 体温 / 3.0)
                        </text>
                    )}
                </g>
            </svg>

            {/* 疑問符アイコン (一人当たり生産性の場合のみ表示) */}
            {yAxisMode === "productivity" && (
                <div 
                    className="absolute top-1/2 left-2 -translate-y-1/2 cursor-help z-10 group/axis-help"
                    onMouseEnter={() => setShowAxisHelp(true)}
                    onMouseLeave={() => setShowAxisHelp(false)}
                >
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-slate-200 transition-colors">?</div>
                </div>
            )}

            {/* 軸の解説ツールチップ */}
            {showAxisHelp && yAxisMode === "productivity" && (
                <div className="absolute top-1/2 left-10 -translate-y-1/2 w-56 bg-slate-800 text-white p-4 rounded-2xl shadow-2xl text-[10px] leading-relaxed z-[50] animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="font-bold text-white mb-2 flex items-center gap-1.5">一人当たり生産性</div>
                    <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[9px] text-emerald-400 mb-2.5 border border-slate-700">
                        KPI達成率 × (体温スコア ÷ 3.0)
                    </div>
                    <div className="text-slate-300">
                        部署ごとに異なるKPIを「達成率」で統一。
                        体温スコア3.0点を係数1.0の基準とし、それを上回るほど生産性が高く評価されます。
                    </div>
                </div>
            )}

            {/* リッチなHTML浮遊ツールチップ */}
            {hoveredId && (() => {
                const d = data.find(item => item.id === hoveredId);
                if (!d) return null;
                const x = cx(d.head);
                const y = cy(yAxisMode === "kpi" ? d.kpiAch : d.productivity);
                
                const leftPct = (x / W) * 100;
                const topPct = (y / H) * 100;

                const hasEnoughResponses = d.respondentsCount !== undefined ? d.respondentsCount >= 1 : d.pulse > 0;
                const isGrayOut = !hasEnoughResponses || d.pulse === 0;
                const dotCol = isGrayOut ? colors.gray : (d.weather === "sun" ? colors.sun : d.weather === "rain" ? colors.rain : colors.cloud);

                return (
                    <div 
                        className="absolute bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl text-[11px] pointer-events-none z-30 transition-all duration-200 border border-slate-700/50 w-52 leading-relaxed"
                        style={{ 
                            left: `${leftPct}%`, 
                            top: `${topPct - 2}%`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <div className="font-black text-xs border-b border-slate-700/50 pb-2 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotCol }} />
                            <span className="truncate">{d.name}</span>
                        </div>
                        <div className="space-y-1.5 text-slate-300 font-medium">
                            <div className="flex justify-between gap-4">
                                <span>メンバー規模:</span>
                                <span className="font-bold text-white">{d.head}名</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>KPI達成率:</span>
                                <span className={cn(
                                    "font-black text-white",
                                    d.kpiAch >= 100 ? "text-emerald-400" : "text-white"
                                )}>{d.kpiAch}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>体温スコア:</span>
                                <span className="font-bold text-white">{d.pulse > 0 ? `${d.pulse.toFixed(1)}点` : "未取得"}</span>
                            </div>
                            {yAxisMode === "productivity" && (
                                <div className="flex justify-between gap-4 border-t border-slate-800 pt-1.5 mt-1.5">
                                    <span>生産性スコア:</span>
                                    <span className="font-black text-emerald-400">{d.productivity.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );

    return (
        <>
            <div className="w-full bg-white rounded-xl border border-slate-100 shadow-sm relative">
                <div className="p-2 pb-4 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    {renderChart()}
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 p-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    拡大表示
                </button>
            </div>

            {/* モーダル表示 */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 relative shadow-2xl touch-pan-y" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-sm md:text-base font-black text-slate-800 px-1">
                                    {isProduct ? `${sizeKpiName}別` : "部署別"} マトリックス 詳細
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 px-1 uppercase tracking-wider">
                                    縦軸: {yAxisMode === "kpi" ? "KPI達成率" : "一人当たり生産性"} ｜ 横軸: 人数 ｜ サイズ: {sizeKpiName}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="w-full mx-auto" style={{ minWidth: 'min(100%, 600px)' }}>
                            {renderChart()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
