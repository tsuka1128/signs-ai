"use client";

import { X, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Thermometer, Shield, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

/**
 * 深層AI分析レポートのデータ構造
 */
interface DeepReportSection {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    content: string;
    highlights?: { label: string; value: string; trend?: "up" | "down" | "flat"; color?: string }[];
}

interface DeepReportProps {
    isOpen: boolean;
    onClose: () => void;
    sections: DeepReportSection[];
    generatedAt?: string;
}

/**
 * 経営層向け深層AI分析レポート
 * 全画面シートモーダルで、組織全体の大局的な考察を表示する
 */
export function DeepReport({ isOpen, onClose, sections, generatedAt }: DeepReportProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50/95 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center">
                            <span className="text-lg">🧠</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 tracking-tight">AI 組織診断レポート</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Deep Analysis Report — {generatedAt || "2026年3月度"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
                    {/* Lead Message */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            本レポートは、今月の<strong className="text-slate-800">KPI実績</strong>・<strong className="text-slate-800">ボイスチェック（組織体温）</strong>・<strong className="text-slate-800">組織方針</strong>の3つのデータを掛け合わせ、
                            AIが多角的に分析した結果です。数字の裏にある構造的な課題と打ち手を、経営判断の材料としてご活用ください。
                        </p>
                    </div>

                    {/* Sections */}
                    {sections.map((section, index) => (
                        <div
                            key={section.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
                        >
                            {/* Section Header */}
                            <div className="px-6 pt-6 pb-4 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0 shadow-inner shadow-teal/5">
                                    {section.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-bold">
                                            {String(index + 1).padStart(2, "0")}
                                        </Badge>
                                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{section.title}</h3>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{section.subtitle}</p>
                                </div>
                            </div>

                            {/* Highlights */}
                            {section.highlights && section.highlights.length > 0 && (
                                <div className="px-6 pb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {section.highlights.map((h, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{h.label}</div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("text-lg font-black tabular-nums tracking-tighter", h.color || "text-slate-800")}>
                                                        {h.value}
                                                    </span>
                                                    {h.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                                                    {h.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="px-6 pb-6">
                                <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-50">
                                    <p className="text-sm text-slate-600 leading-[1.8] font-medium whitespace-pre-line">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Footer */}
                    <div className="text-center py-8 space-y-3">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                            Generated by Signs AI — Powered by KPI × Voice × Policy
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            ダッシュボードに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
