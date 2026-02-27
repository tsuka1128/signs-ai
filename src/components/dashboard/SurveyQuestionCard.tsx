"use client";

import { cn } from "@/lib/utils";

interface SurveyQuestionCardProps {
    question: string;
    hint: string;
    score: number;
    prevScore?: number;
}

export function SurveyQuestionCard({ question, hint, score, prevScore }: SurveyQuestionCardProps) {
    const diff = prevScore ? score - prevScore : 0;

    // Color logic based on score
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
                    <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-teal transition-colors">
                        {question}
                    </h4>
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
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-1000", getBarColor(score))}
                        style={{ width: `${(score / 5) * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>体温スコア</span>
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
