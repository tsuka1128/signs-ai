"use client";

import { cn } from "@/lib/utils";

interface ProductInsightProps {
    name: string;
    tag: string;
    text: string;
    type: "star" | "dog" | "question";
}

export function ProductInsight({ name, tag, text, type }: ProductInsightProps) {
    const icons = {
        star: "⭐",
        dog: "⚠️",
        question: "🌱"
    };

    const tagColors = {
        star: "text-emerald-500",
        dog: "text-rose-500",
        question: "text-teal"
    };

    const bgColors = {
        star: "bg-emerald-50/30 border-emerald-100/50",
        dog: "bg-rose-50/30 border-rose-100/50",
        question: "bg-teal/5 border-teal/10"
    };

    return (
        <div className={cn("p-5 rounded-2xl border transition-all", bgColors[type])}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{icons[type]}</span>
                <span className="text-sm font-bold text-slate-800">{name}</span>
                <span className={cn("text-[10px] font-bold uppercase", tagColors[type])}>{tag}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {text}
            </p>
        </div>
    );
}
