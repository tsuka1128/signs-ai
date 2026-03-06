"use client";

import { cn } from "@/lib/utils";

interface KpiSummaryCardProps {
    name: string;
    value: string;
    unit: string;
    isActive: boolean;
    onClick: () => void;
}

export function KpiSummaryCard({ name, value, unit, isActive, onClick }: KpiSummaryCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-start p-4 bg-white rounded-2xl border transition-all duration-300 min-w-[124px] text-left shrink-0 shadow-sm",
                isActive
                    ? "border-teal bg-teal/5 ring-2 ring-teal/10 translate-y-[-2px]"
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
            )}
        >
            <span className="text-[10px] text-slate-400 font-black mb-1.5 uppercase tracking-wider">{name}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-800 tabular-nums leading-none">{value}</span>
                <span className="text-[10px] text-slate-400 font-bold leading-none">{unit}</span>
            </div>
        </button>
    );
}
