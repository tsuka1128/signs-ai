"use client";

import { Badge } from "@/components/ui/Badge";
import { SparkLine } from "@/components/dashboard/SparkLine";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    name: string;
    value: string | number;
    unit: string;
    target?: number;
    prevData: number[];
    dept: string;
    achievementRate?: number | null;
    isSelected?: boolean;
    onClick?: () => void;
}

export function KpiCard({
    name,
    value,
    unit,
    target,
    prevData,
    dept,
    achievementRate,
    isSelected,
    onClick
}: KpiCardProps) {
    const isPositive = prevData[prevData.length - 1] >= prevData[prevData.length - 2];
    const accentColor = isPositive ? "#10B981" : "#EF4444";

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-sm",
                isSelected
                    ? "border-teal ring-1 ring-teal/20 shadow-md transform -translate-y-0.5"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-sm font-bold text-dark">{name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-slate-100 text-slate-500 font-medium">担当: {dept}</Badge>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-dark tabular-nums">{value}</span>
                        <span className="text-xs font-semibold text-slate-400">{unit}</span>
                    </div>
                    {achievementRate !== undefined && achievementRate !== null && (
                        <div className={cn(
                            "text-[10px] font-bold mt-1",
                            achievementRate >= 100 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            達成率 {achievementRate}%
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <SparkLine data={prevData} color={accentColor} />
            </div>

            {achievementRate !== undefined && achievementRate !== null && (
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-bold">
                        <span>目標進捗</span>
                        <span>{achievementRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                achievementRate >= 100 ? "bg-emerald-500" : "bg-rose-500"
                            )}
                            style={{ width: `${Math.min(achievementRate, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
