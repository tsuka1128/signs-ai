"use client";

import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
}

interface TabBarProps {
    tabs: Tab[];
    active: string;
    onChange: (id: string) => void;
    className?: string;
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
    return (
        <div className={cn("flex gap-1 bg-slate-100 rounded-xl p-1", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                        active === tab.id
                            ? "bg-white text-dark shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
