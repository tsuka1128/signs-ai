"use client";

import React from "react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Lock, Rocket, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function TrialGuard({ children }: { children: React.ReactNode }) {
    const { isTrial, trialDaysRemaining, loading, planName } = usePlanFeatures();
    const [isVisible, setIsVisible] = useState(false);

    // 期限切れかどうかの判定
    const isExpired = isTrial && (trialDaysRemaining === null || trialDaysRemaining <= 0);

    useEffect(() => {
        if (!isExpired || loading) return;
        setIsVisible(true);
    }, [isExpired, loading]);

    // 常時 children を表示（その上にガードを被せる）
    // ただし、表示状態（isVisible）になるまではガードを出さない
    if (!isVisible) return <>{children}</>;

    // トライアル終了時の表示
    return (
        <div className="relative">
            {children}
            <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 text-center animate-in fade-in duration-1000">
            <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                {/* 装飾 */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
                
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-rose-200">
                    <Lock className="w-10 h-10 text-rose-500" />
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">
                    トライアル期間（70日間）が終了しました
                </h2>
                <p className="text-sm text-slate-500 font-bold leading-relaxed mb-10">
                    ご試用ありがとうございました。現在、データの閲覧および機能の利用が一時的に停止されています。
                    引き続きご利用いただくには、プランのご契約が必要です。
                </p>

                <div className="space-y-4">
                    <Link 
                        href="/marketing#pricing"
                        className="w-full py-4 bg-teal-500 text-white rounded-2xl font-black shadow-lg shadow-teal-200 hover:bg-teal-600 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        プラン契約の詳細を確認する
                    </Link>
                    {/* TODO: 本番用の問い合わせリンク（またはフォーム）を後で設定する */}
                    <button 
                        className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        onClick={() => window.open('/marketing#contact', '_blank')}
                    >
                        <MessageCircle className="w-5 h-5" />
                        担当者に問い合わせる
                    </button>
                </div>

                <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Signs AI — {planName}
                </p>
            </div>
        </div>
        </div>
    );
}
