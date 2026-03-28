"use client";

import { Sun, Cloud, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherIconProps {
    type: "sun" | "cloud" | "rain";
    size?: number;
    className?: string;
}

export function WeatherIcon({ type, size = 40, className }: WeatherIconProps) {
    const Icon = type === "sun" ? Sun : type === "cloud" ? Cloud : CloudRain;
    const color = type === "sun" ? "text-amber-400" : type === "cloud" ? "text-slate-400" : "text-indigo-400";
    
    return (
        <Icon 
            size={size} 
            className={cn("animate-float leading-none", color, className)} 
        />
    );
}

