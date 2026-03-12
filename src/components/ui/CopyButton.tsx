"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
    value: string;
    className?: string;
    iconSize?: number;
}

export function CopyButton({ value, className, iconSize = 14 }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1.5 rounded-md transition-all active:scale-90",
                copied
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-100",
                className
            )}
            title={copied ? "コピーしました" : "クリップボードにコピー"}
        >
            {copied ? (
                <Check size={iconSize} className="animate-in zoom-in duration-200" />
            ) : (
                <Copy size={iconSize} />
            )}
        </button>
    );
}
