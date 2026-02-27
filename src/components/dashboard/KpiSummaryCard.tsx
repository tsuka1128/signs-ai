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
                "flex flex-col items-start p-3 bg-white rounded-xl border transition-all duration-200 min-w-[100px] text-left shrink-0",
                isActive
                    ? "border-teal bg-teal/5 ring-1 ring-teal/20"
                    : "border-slate-200 hover:border-slate-300"
            )}
        >
            <span className="text-[10px] text-slate-400 font-bold mb-1">{name}</span>
            <div className="flex items-baseline gap-0.5">
                <span className="text-base font-extrabold text-slate-800">{value}</span>
                <span className="text-[9px] text-slate-400 font-medium">{unit}</span>
            </div>
        </button>
    );
}
