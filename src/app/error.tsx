"use client";

/**
 * グローバルエラーバウンダリ (Refined Premium Version)
 * ランタイムエラー発生時にブランドに沿ったプレミアムなエラー画面を表示します。
 */

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // ここで Sentry 等にエラーを送信する処理を入れるのが理想的
        console.error("[Signs AI Critical Error]:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
            {/* 背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-md w-full relative">
                <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] rounded-[40px] p-10 sm:p-12 text-center space-y-8">
                    
                    {/* アイコンセクション */}
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-rose-500/10 rounded-3xl rotate-12 animate-pulse" />
                        <div className="relative w-20 h-20 bg-white rounded-3xl shadow-sm border border-rose-100 flex items-center justify-center text-rose-500">
                            <AlertCircle size={36} strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* テキストコンテンツ */}
                    <div className="space-y-3">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
                            問題が発生しました
                        </h1>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                            予期しないエラーにより、処理を中断しました。<br />
                            システム管理者に通知されました。再試行をお願いします。
                        </p>
                    </div>

                    {/* エラー詳細 (開発用) */}
                    {process.env.NODE_ENV === "development" && (
                        <div className="bg-slate-900/5 border border-slate-200/50 rounded-2xl p-4 text-left overflow-hidden">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Debug Info</p>
                            <div className="text-[11px] font-mono text-rose-600 break-all max-h-24 overflow-y-auto leading-normal">
                                {error.message || "Unknown error occurred."}
                            </div>
                        </div>
                    )}

                    {/* アクションボタン */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={reset}
                            className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold text-[13px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                        >
                            <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span>もう一度試す</span>
                        </button>
                        
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white text-slate-600 font-bold text-[13px] rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                        >
                            <Home size={16} />
                            <span>ダッシュボードへ戻る</span>
                        </a>
                    </div>

                    {/* フッターデコレーション */}
                    <div className="pt-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full mb-6" />
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
                            Signs AI System Recovery
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
