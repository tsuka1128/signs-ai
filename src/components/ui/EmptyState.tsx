"use client";

import { AlertCircle, PlusCircle } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    icon?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    actionLabel,
    actionHref,
    icon = <AlertCircle className="w-12 h-12 text-slate-200" />
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed mb-6">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-slate-200 transition-all text-[10px] uppercase tracking-widest"
                >
                    <PlusCircle className="w-3.5 h-3.5 text-teal" />
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
