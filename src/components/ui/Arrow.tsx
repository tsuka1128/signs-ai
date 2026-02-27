"use client";

import { cn } from "@/lib/utils";

interface ArrowProps {
    direction: "up" | "down" | "flat";
    className?: string;
}

export function Arrow({ direction, className }: ArrowProps) {
    const char = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
    const colorClass = direction === "up" ? "text-emerald-500" : direction === "down" ? "text-rose-500" : "text-slate-400";

    return (
        <span className={cn("font-bold text-base", colorClass, className)}>
            {char}
        </span>
    );
}
