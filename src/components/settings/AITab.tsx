"use client";

import { Sparkles, Activity, ShieldCheck, Rocket, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addMonths, nextMonday, startOfMonth, format } from "date-fns";
import { PlanGate } from "@/components/ui/PlanGate";

interface AITabProps {
    isAnalyzing: boolean;
    handleRunAnalyze: () => void;
    company: any;
    plan: any;
    limits: any;
}

export const AITab = ({ isAnalyzing, handleRunAnalyze, company, plan, limits }: AITabProps) => {
    // スケジュール計算
    const badgeFrequency = plan?.ai_badge_frequency || 'monthly';
    const nextAutoDate = badgeFrequency === 'weekly' 
        ? nextMonday(new Date()) 
        : startOfMonth(addMonths(new Date(), 1));
    const nextAutoDateStr = format(nextAutoDate, "yyyy年MM月dd日");

    // トラッキング計算
    const used = company?.manual_ai_runs_used_this_month || 0;
    const max = limits?.manualAiRuns || 1;
    const remaining = Math.max(0, max - used);
    const limitReached = remaining <= 0;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal" /> AI分析実行・設定
                </h2>
                <div className="space-y-6 max-w-xl">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Activity className="w-6 h-6 text-teal" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-sm font-black text-slate-700">ダッシュボード情報のAI分析</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    現在設定されている部署・KPI構成と入力された履歴データに基づき、組織状態の自動推測とインサイトレポートを生成します。<br/>
                                    ※分析処理には数十秒かかる場合があります。
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-200/60 pt-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-500">今月の手動実行可能枠</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-black tracking-widest", limitReached ? "text-rose-500" : "text-teal")}>{remaining}回</span>
                                    <span className="text-slate-400 font-bold">/ {max}回</span>
                                </div>
                            </div>
                            
                            {/* プログレスバー */}
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                {Array.from({ length: max }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "flex-1 h-full border-r border-white/50 last:border-0 transition-all",
                                            i < used ? (limitReached ? "bg-rose-400" : "bg-teal") : "bg-slate-100"
                                        )} 
                                    />
                                ))}
                            </div>

                            <div className="pt-2">
                                <PlanGate feature="manual_ai_runs" showOverlay={false}>
                                    <button
                                        onClick={handleRunAnalyze}
                                        disabled={isAnalyzing || limitReached}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all shadow-lg",
                                            isAnalyzing || limitReached
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                                : "bg-teal text-white hover:bg-teal/90 shadow-teal/20"
                                        )}
                                    >
                                        {isAnalyzing ? "最新の分析を生成中..." : limitReached ? "上限に達しています" : "最新の分析を生成する"}
                                        {!(isAnalyzing || limitReached) && <Rocket className="w-5 h-5" />}
                                    </button>
                                </PlanGate>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <h3 className="text-sm font-black text-slate-700">次回の自動分析（バッジ更新）スケジュール</h3>
                        </div>
                        <p className="text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-xl leading-relaxed">
                            ご契約のプランに基づき、自動で組織状態の推測とバッジ更新が行われます。<br/>
                            次回の実行予定：<span className="text-teal font-black">{nextAutoDateStr}</span> <span className="text-[10px] uppercase">({badgeFrequency})</span>
                        </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 text-sm font-bold text-slate-500">
                        <CheckCircle2 className="w-5 h-5 text-slate-300" />
                        分析は安全に実行され、外部にデータが漏洩することはありません。
                    </div>
                </div>
            </div>
        </div>
    );
};
