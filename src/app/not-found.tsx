/**
 * 404 Not Found ページ (Refined Premium Version)
 * 存在しないURLにアクセスした際に、ブランドに沿ったプレミアムな案内画面を表示します。
 */

import Link from "next/link";
import { Search, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
            {/* 背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-teal-50 rounded-full blur-[100px] opacity-70" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-50 rounded-full blur-[100px] opacity-70" />
            </div>

            <div className="max-w-md w-full relative">
                <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] rounded-[40px] p-10 sm:p-12 text-center space-y-9">
                    
                    {/* アイコンセクション */}
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-slate-100 rounded-full animate-[ping_3s_ease-in-out_infinite] opacity-50" />
                        <div className="relative w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-black text-slate-200">4</span>
                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mx-1">
                                    <Search size={22} className="text-teal-600" />
                                </div>
                                <span className="text-4xl font-black text-slate-200">4</span>
                            </div>
                        </div>
                    </div>

                    {/* テキストコンテンツ */}
                    <div className="space-y-4">
                        <div className="inline-flex px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                            Page Not Found
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
                            ページが見つかりません
                        </h1>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                            お探しのページは、URLが変更されたか、<br />
                            現在は公開されていない可能性があります。
                        </p>
                    </div>

                    {/* アクションボタン */}
                    <div className="space-y-3 pt-2">
                        <Link
                            href="/"
                            className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold text-[13px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>ダッシュボードへ戻る</span>
                        </Link>
                        
                        <Link
                            href="/docs"
                            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white text-slate-600 font-bold text-[13px] rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                        >
                            <HelpCircle size={16} />
                            <span>ヘルプ・マニュアルを確認</span>
                        </Link>
                    </div>

                    {/* フッターデコレーション */}
                    <div className="pt-2">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
                            Signs AI
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
