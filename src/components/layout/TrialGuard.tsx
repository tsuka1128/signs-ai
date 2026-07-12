"use client";

import React from "react";
import Link from "next/link";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { AlertTriangle, Rocket, MessageCircle } from "lucide-react";

/**
 * トライアル期限切れの通知バナー。
 *
 * 以前は全画面ロック（データの閲覧も含めて完全に停止）していたが、
 * 実際の書き込み制限はDB(RLS)で行っており閲覧は引き続き可能なため、
 * UIも「閲覧は可能・新規保存はできない」という実態に合わせ、
 * 非ブロッキングのバナーに変更した。
 */
export function TrialGuard({ children }: { children: React.ReactNode }) {
    const { isTrial, trialDaysRemaining, loading, planName } = usePlanFeatures();

    const isExpired = isTrial && (trialDaysRemaining === null || trialDaysRemaining <= 0);

    if (loading || !isExpired) return <>{children}</>;

    return (
        <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">
                            トライアル期間（70日間）が終了しました
                        </p>
                        <p className="text-xs text-slate-500 font-bold mt-0.5 leading-relaxed">
                            閲覧は引き続き可能ですが、KPI・アンケート回答など新規データの保存はできません。ご契約後、すぐに再開できます。
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Link
                        href="/marketing#pricing"
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white rounded-xl font-black text-xs shadow-sm hover:bg-teal-600 transition-all whitespace-nowrap"
                    >
                        <Rocket className="w-3.5 h-3.5" />
                        プランを見る
                    </Link>
                    <a
                        href="mailto:info@signs-ai.jp?subject=トライアル終了後のプラン契約について"
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-50 transition-all whitespace-nowrap"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        問い合わせる
                    </a>
                </div>
            </div>
            {children}
            <p className="sr-only">Signs AI — {planName}</p>
        </div>
    );
}
