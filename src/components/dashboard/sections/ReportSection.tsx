"use client";

import { TrendingUp, TrendingDown, Brain, Target, Thermometer, Shield, AlertTriangle, Lightbulb, Rocket } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { Badge } from "@/components/ui/Badge";

interface DeepReportSection {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    content: string;
    highlights?: { label: string; value: string; trend?: "up" | "down" | "flat"; color?: string }[];
}

interface ReportSectionProps {
    sections: DeepReportSection[];
    generatedAt?: string;
    leadMessage?: string;
    /** AI分析が一度でも実行済みか。false の場合は各セクションの偽ローディング文言の代わりに実行導線を出す */
    hasReport?: boolean;
    /** 現在のユーザーがAI分析の実行操作を行える権限か（管理者以上） */
    canRunAnalyze?: boolean;
    isAnalyzing?: boolean;
    onRunAnalyze?: () => void;
}

/**
 * AI組織診断レポート セクション
 * ダッシュボードのメインエリアに直接レンダリングされる形式のレポート
 */
export function ReportSection({ sections, generatedAt, leadMessage, hasReport = true, canRunAnalyze = false, isAnalyzing = false, onRunAnalyze }: ReportSectionProps) {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Title / Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center shadow-inner shadow-teal/5">
                        <Brain className="w-6 h-6 text-teal" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI 組織診断レポート</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            AI詳細分析レポート — {generatedAt || "未生成"}
                        </p>
                    </div>
                </div>
                <div className="hidden sm:block">
                    <Badge className="bg-teal text-white font-black px-3 py-1">AI詳細分析</Badge>
                </div>
            </div>

            {!hasReport ? (
                /* 未実行時: 「分析中です...」という終わらない偽ローディングの代わりに、明確な実行導線を出す */
                <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm text-center space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
                        <Brain className="w-7 h-7 text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base font-black text-slate-800">AI組織診断はまだ実行されていません</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                            KPI・ボイスチェック・組織方針のデータをもとに、総評から具体的な提言までをAIが生成します。
                        </p>
                    </div>
                    {canRunAnalyze ? (
                        <button
                            onClick={onRunAnalyze}
                            disabled={isAnalyzing}
                            className={cn(
                                "inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg",
                                isAnalyzing
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-teal text-white hover:bg-teal/90 shadow-teal/20"
                            )}
                        >
                            {isAnalyzing ? "分析を生成中..." : "今すぐAI分析を実行する"}
                            {!isAnalyzing && <Rocket className="w-4 h-4" />}
                        </button>
                    ) : (
                        <p className="text-xs text-slate-400 font-bold">実行は管理者にご依頼ください。</p>
                    )}
                </div>
            ) : (
            <>
            {/* Lead Message */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-teal/10" />
                <p className="text-base text-slate-600 leading-relaxed font-medium relative z-10">
                    {leadMessage || (
                        <>
                            本レポートは、今月の<strong className="text-slate-900">KPI実績</strong>・<strong className="text-slate-900">ボイスチェック（組織体温）</strong>・<strong className="text-slate-900">組織方針</strong>の3つのデータを掛け合わせ、
                            AIが多角的に分析した結果です。数字の裏にある構造的な課題と打ち手を、経営判断の材料としてご活用ください。
                        </>
                    )}
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {sections.map((section, index) => (
                    <div
                        key={section.id}
                        className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-teal/20"
                    >
                        {/* Section Header */}
                        <div className="px-8 pt-8 pb-4 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-sm text-slate-700">
                                {section.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-teal tabular-nums bg-teal/5 px-2 py-0.5 rounded-lg border border-teal/10">
                                        SECTION {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{section.title}</h3>
                                </div>
                                <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-[0.2em]">{section.subtitle}</p>
                            </div>
                        </div>

                        {/* Highlights if any */}
                        {section.highlights && section.highlights.length > 0 && (
                            <div className="px-8 pb-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {section.highlights.map((h, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 transition-colors hover:bg-white hover:shadow-sm">
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">{h.label}</div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-xl font-black tabular-nums tracking-tighter", h.color || "text-slate-900")}>
                                                    {h.value}
                                                </span>
                                                {h.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                                {h.trend === "down" && <TrendingDown className="w-4 h-4 text-rose-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="px-8 pb-8">
                            <div className="bg-slate-50/30 rounded-2xl p-6 border border-slate-50/50">
                                <p className="text-sm text-slate-600 leading-[1.8] font-medium whitespace-pre-line">
                                    {section.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Information */}
            <div className="pt-12 text-center space-y-4 pb-20">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="flex flex-col items-center gap-2">
                    <p className="text-[11px] text-slate-500 font-bold bg-slate-100 px-4 py-1.5 rounded-full">
                        KPI × 組織体温 × 組織方針を統合して分析しています
                    </p>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
