"use client";

import { cn } from "@/lib/utils/index";

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

/**
 * タブバーコンポーネント
 * タブ数が多い場合は横スクロールで全タブにアクセス可能
 */
export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
    return (
        <div className={cn(
            "flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto scrollbar-hide",
            className
        )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
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
