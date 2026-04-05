"use client";

import { Sparkles, Activity, ShieldCheck, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface AITabProps {
    isAnalyzing: boolean;
    handleRunAnalyze: () => void;
    planFeatureComponent?: React.ReactNode;
}

export const AITab = ({ isAnalyzing, handleRunAnalyze, planFeatureComponent }: AITabProps) => {
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

                        <div className="mt-6 border-t border-slate-200/60 pt-6">
                            {planFeatureComponent ? planFeatureComponent : (
                                <button
                                    onClick={handleRunAnalyze}
                                    disabled={isAnalyzing}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all shadow-lg",
                                        isAnalyzing
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                            : "bg-teal text-white hover:bg-teal/90 shadow-teal/20"
                                    )}
                                >
                                    {isAnalyzing ? "最新の分析を生成中..." : "最新の分析を生成する"}
                                    {!isAnalyzing && <Rocket className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 text-sm font-bold text-slate-500">
                        <ShieldCheck className="w-5 h-5 text-slate-300" />
                        分析は安全に実行され、外部にデータが漏洩することはありません。
                    </div>
                </div>
            </div>
        </div>
    );
};
