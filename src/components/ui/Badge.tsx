"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({ children, className }: BadgeProps) {
    return (
        <span className={cn(
            "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider",
            className
        )}>
            {children}
        </span>
    );
}
