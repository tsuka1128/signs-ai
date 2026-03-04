"use client";

import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { Arrow } from "@/components/ui/Arrow";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface KpiItem {
    name: string;
    val: string;
    ach: number | null;
    type: string;
}

interface OrganizationCardProps {
    name: string;
    head: number;
    pulse: number;
    weather: "sun" | "cloud" | "rain";
    arrow: "up" | "down" | "flat";
    kpis: KpiItem[];
}

export function OrganizationCard({ name, head, pulse, weather, arrow, kpis }: OrganizationCardProps) {
    const isNone = pulse === 0;
    const risk = isNone ? "none" : pulse < 2.5 ? "overheat" : pulse >= 3.5 ? "stable" : "caution";
    const pulseColorClass = isNone ? "text-slate-300" : pulse >= 3.5 ? "text-emerald-500" : pulse >= 2.5 ? "text-amber-500" : "text-rose-500";

    return (
        <div className={cn(
            "rounded-2xl overflow-hidden border transition-all duration-200",
            risk === "overheat" ? "bg-rose-50/20 border-rose-100 shadow-sm" : "bg-white border-slate-100 shadow-sm hover:shadow-md"
        )}>
            {/* Header section */}
            <div className={cn("flex items-center gap-4 px-5 py-4 border-b", risk === "overheat" ? "border-rose-50" : "border-slate-50")}>
                <div className="flex items-center gap-3 min-w-[100px]">
                    <WeatherIcon type={isNone ? "cloud" : weather} size={32} className={isNone ? "opacity-20 grayscale" : ""} />
                    <div>
                        <div className={cn("text-2xl font-extrabold tabular-nums leading-none", pulseColorClass)}>
                            {isNone ? "-" : pulse.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">/5.0 体温</div>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-100" />

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tighter">{head}名</span>
                        <Arrow direction={arrow} />
                    </div>
                </div>

                <Badge className={cn(
                    "border-none text-[10px] font-bold px-3 py-1",
                    risk === "overheat" ? "bg-rose-100 text-rose-500" :
                        risk === "stable" ? "bg-emerald-100 text-emerald-500" :
                            risk === "none" ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-500"
                )}>
                    {risk === "overheat" ? "🔥 オーバーヒート" :
                        risk === "stable" ? "✅ 適温" :
                            risk === "none" ? "😶 未計測" : "⚠️ 要注意"}
                </Badge>
            </div>

            {/* KPI Grid */}
            <div className={cn(
                "grid divide-x divide-slate-100",
                kpis.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
            )}>
                {kpis.map((k, i) => {
                    const achColor = k.ach === null ? "text-slate-400" : k.ach >= 100 ? "text-emerald-500" : k.ach >= 80 ? "text-amber-500" : "text-rose-500";
                    const achBg = k.ach === null ? "bg-slate-100" : k.ach >= 100 ? "bg-emerald-400" : k.ach >= 80 ? "bg-amber-400" : "bg-rose-400";

                    return (
                        <div key={i} className="p-4 space-y-2">
                            <div className="flex items-center gap-1.5 min-h-[16px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{k.name}</span>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    {k.type === "stack" ? "積上" : k.type === "rate" ? "率" : "抑制"}
                                </span>
                            </div>
                            <div className="text-lg font-black text-slate-800 tabular-nums leading-tight">{k.val}</div>
                            {k.ach !== null && (
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold tracking-tight">
                                        <span className="text-slate-400">達成率</span>
                                        <span className={achColor}>{k.ach}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", achBg)}
                                            style={{ width: `${Math.min(k.ach, 120) / 1.2}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
