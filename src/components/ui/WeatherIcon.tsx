"use client";

import { cn } from "@/lib/utils";

interface WeatherIconProps {
    type: "sun" | "cloud" | "rain";
    size?: number;
    className?: string;
}

export function WeatherIcon({ type, size = 40, className }: WeatherIconProps) {
    const emoji = type === "sun" ? "☀️" : type === "cloud" ? "☁️" : "☔️";
    return (
        <span
            style={{ fontSize: size }}
            className={cn("inline-block animate-float leading-none", className)}
        >
            {emoji}
        </span>
    );
}
