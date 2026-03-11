"use client";

import { motion } from "framer-motion";

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function Loading({ message = "読み込み中...", fullScreen = false }: LoadingProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="relative">
                <motion.div
                    className="w-12 h-12 border-4 border-teal-100 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute top-0 left-0 w-12 h-12 border-4 border-t-teal-500 border-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-teal-500 italic">S</span>
                </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                {message}
            </p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
}

export function LoadingCard() {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex items-center justify-center min-h-[300px] animate-pulse">
            <Loading />
        </div>
    );
}
