"use client";

import { cn } from "@/lib/utils";

interface FeedbackItemProps {
    from: string;
    to: string;
    text: string;
    type: "positive" | "warning" | "alert" | "info";
}

export function FeedbackItem({ from, to, text, type }: FeedbackItemProps) {
    const icons = {
        positive: "👍",
        warning: "⚠️",
        alert: "🚨",
        info: "🗣️"
    };

    const bgColors = {
        positive: "bg-slate-50",
        warning: "bg-slate-50",
        alert: "bg-slate-50",
        info: "bg-slate-50"
    };

    return (
        <div className={cn("p-4 rounded-xl flex gap-4 items-start transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100", bgColors[type])}>
            <span className="text-lg mt-0.5 shrink-0">{icons[type]}</span>
            <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{from}</span>
                    <span className="text-slate-300 text-[10px]">→</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{to}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {text}
                </p>
            </div>
        </div>
    );
}
