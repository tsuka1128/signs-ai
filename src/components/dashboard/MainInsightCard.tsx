"use client";

import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { Arrow } from "@/components/ui/Arrow";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface MainInsightCardProps {
    icon: string;
    title: string;
    tone: string;
    text: string;
    weather: "sun" | "cloud" | "rain";
    trend: "up" | "down" | "flat";
}

export function MainInsightCard({ icon, title, tone, text, weather, trend }: MainInsightCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-glow">
            <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-0.5 min-w-[64px]">
                    <WeatherIcon type={weather} size={48} />
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-400">
                            {weather === "sun" ? "☀️" : weather === "cloud" ? "☁️" : "☔️"}
                        </span>
                        <Arrow direction={trend} />
                    </div>
                    <span className="text-[10px] text-slate-400">全体体温</span>
                </div>

                <div className="w-px h-16 bg-slate-100" />

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{icon}</span>
                        <Badge className="bg-teal/10 text-teal">{title}向け</Badge>
                        <span className="text-[10px] text-slate-400">トーン: {tone}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 font-medium">
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
}
