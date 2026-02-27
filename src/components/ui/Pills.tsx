"use client";

import { cn } from "@/lib/utils";

interface PillItem {
    id: string;
    label: string;
}

interface PillsProps {
    items: PillItem[];
    active: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Pills({ items, active, onChange, className }: PillsProps) {
    return (
        <div className={cn("flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide", className)}>
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border",
                        active === item.id
                            ? "bg-dark text-white border-dark shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
