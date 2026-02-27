"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface ActionItemProps {
    priority: string;
    title: string;
    description: string;
    dept: string;
    owner: string;
}

export function ActionItem({ priority, title, description, dept, owner }: ActionItemProps) {
    const isUrgent = priority.includes("緊急") || priority.includes("🔴");

    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all duration-200",
            isUrgent ? "bg-rose-50/50 border-rose-100" : "bg-white border-slate-100 shadow-sm"
        )}>
            <div className="flex items-center gap-3 mb-2.5">
                <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                    isUrgent ? "bg-rose-500 text-white" : "bg-amber-400 text-white"
                )}>
                    {priority.replace(/[^ぁ-んァ-ン一-龠]/g, "")}
                </span>
                <h5 className="text-sm font-bold text-slate-800">{title}</h5>
            </div>

            <p className="text-xs leading-relaxed text-slate-500 mb-3 font-medium">
                {description}
            </p>

            <div className="flex flex-wrap gap-2">
                <Badge className="bg-teal/10 text-teal border-none font-bold">
                    {dept}
                </Badge>
                <Badge className="bg-slate-100 text-slate-500 border-none font-bold">
                    推奨担当: {owner}
                </Badge>
            </div>
        </div>
    );
}
