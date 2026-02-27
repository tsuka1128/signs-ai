"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState } from "react";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-gradient-to-br from-white via-slate-50 to-white px-5 py-6 border-b border-slate-200 relative z-[100]">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <Link href="/" className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200 hover:scale-105 transition-transform">
                            <span className="text-white font-black text-lg italic">S</span>
                        </Link>
                        <span className="text-xl font-extrabold text-slate-800 tracking-tighter">Signs AI</span>
                        <Badge className="bg-teal/10 text-teal border-none text-[10px]">MONTHLY</Badge>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 tracking-widest mt-1 uppercase">組織に体温を</p>
                </div>

                {/* PC Menu */}
                <div className="hidden sm:flex items-center gap-6 text-right">
                    <div className="flex items-center gap-3">
                        <Link href="/kpi" className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1">
                            📊 KPI入力
                        </Link>
                        <Link href="/marketing" className="text-[10px] font-bold bg-slate-800 text-white px-3 py-1.5 rounded-full hover:bg-teal transition-colors shadow-sm flex items-center gap-1">
                            🚀 マーケティングLP
                        </Link>
                        <Link href="/form" className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1">
                            💬 アンケート
                        </Link>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">株式会社サンプルSaaS</p>
                        <p className="text-xs font-black text-slate-800 tabular-nums">2026.02</p>
                    </div>
                </div>

                {/* Mobile Hamburger Button */}
                <div className="sm:hidden flex items-center gap-3">
                    <div className="text-right mr-2">
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">サンプルSaaS</p>
                        <p className="text-[10px] font-black text-slate-800 tabular-nums">2026.02</p>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 -mr-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm"
                    >
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl py-4 px-5 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200 z-[100]">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="col-span-2 text-sm font-bold bg-white border-2 border-slate-100 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:border-slate-300 flex items-center justify-center gap-2">
                            <span className="text-lg">📈</span> ダッシュボード
                        </Link>
                        <Link href="/kpi" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-1.5">
                            <span className="text-lg">📊</span> KPI入力
                        </Link>
                        <Link href="/form" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-1.5">
                            <span className="text-lg">💬</span> 調査
                        </Link>
                    </div>
                    <Link href="/marketing" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold bg-slate-800 text-white px-4 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors">
                        <span className="text-lg">🚀</span> マーケティングLPへ
                    </Link>
                </div>
            )}
        </header>
    );
}
