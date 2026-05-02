"use client";

import { cn } from "@/lib/utils/index";

interface SurveyQuestionCardProps {
    question: string;
    hint: string;
    score: number;
    prevScore?: number;
    deviationDiff?: number;
    allOrgsScores?: number[]; // 全社表示時に他の拠点のスコアをドット表示するため
}

export function SurveyQuestionCard({ question, hint, score, prevScore, deviationDiff, allOrgsScores }: SurveyQuestionCardProps) {
    const diff = prevScore ? score - prevScore : 0;

    const getScoreColor = (s: number) => {
        if (s >= 4.0) return "text-emerald-500 bg-emerald-50";
        if (s >= 3.0) return "text-amber-500 bg-amber-50";
        return "text-rose-500 bg-rose-50";
    };

    const getBarColor = (s: number) => {
        if (s >= 4.0) return "bg-emerald-400";
        if (s >= 3.0) return "bg-amber-400";
        return "bg-rose-400";
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md group">
            <div className="flex justify-between items-start gap-4 mb-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-teal transition-colors">
                            {question}
                        </h4>
                        {deviationDiff !== undefined && (
                            <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded-md tabular-nums",
                                deviationDiff > 0 ? "bg-blue-50 text-blue-500" : 
                                deviationDiff < 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
                            )}>
                                {deviationDiff > 0 ? '+' : ''}{deviationDiff.toFixed(1)}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium tracking-tight">
                        {hint}
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-center shrink-0",
                    getScoreColor(score)
                )}>
                    <span className="text-lg font-black tabular-nums tracking-tighter">{score.toFixed(1)}</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    {/* メインのバー */}
                    <div
                        className={cn("h-full rounded-full transition-all duration-1000", getBarColor(score))}
                        style={{ width: `${(score / 5) * 100}%` }}
                    />
                    
                    {/* 他の拠点の分布表示 (ドット) */}
                    {allOrgsScores && allOrgsScores.length > 1 && allOrgsScores.map((s, idx) => (
                        <div 
                            key={idx}
                            className="absolute top-0 w-0.5 h-full bg-slate-400/30 transition-all duration-1000"
                            style={{ left: `${(s / 5) * 100}%` }}
                        />
                    ))}
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>体温スコア</span>
                        {deviationDiff !== undefined && (
                            <span className="opacity-60 font-medium">
                                (全社比 {deviationDiff > 0 ? '高' : deviationDiff < 0 ? '低' : '並'})
                            </span>
                        )}
                    </div>
                    {prevScore && (
                        <span className={cn(diff > 0 ? "text-emerald-500" : diff < 0 ? "text-rose-500" : "")}>
                            {diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(diff).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
