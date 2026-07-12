"use client";

import { CreditCard, Users, Building2, Target, Sparkles, Rocket, MessageCircle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils/index";
import Link from "next/link";

interface BillingTabProps {
    planName: string;
    isTrial: boolean;
    trialDaysRemaining: number | null;
    limits: {
        maxDepartments: number;
        maxKpis: number;
        maxMembers: number;
        manualAiRuns: number;
    };
    usage: {
        departments: number;
        kpis: number;
        members: number;
        aiRunsUsed: number;
    };
}

function UsageRow({ icon: Icon, label, used, max }: { icon: any; label: string; used: number; max: number }) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    const isNearLimit = pct >= 80;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600">
                    <Icon className="w-4 h-4 text-slate-400" />
                    {label}
                </span>
                <span className={cn("font-black tabular-nums", isNearLimit ? "text-rose-500" : "text-slate-700")}>
                    {used} <span className="text-slate-400 font-bold">/ {max}</span>
                </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-rose-400" : "bg-teal")}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/**
 * 顧客が自分のプラン・トライアル残日数・利用量を確認できるタブ。
 * 以前は期限切れ後にモーダルで初めて「終了しました」と知らされる設計だったため、
 * 通常時から現状を把握でき、早めにアップグレードを検討できるようにする。
 */
export const BillingTab = ({ planName, isTrial, trialDaysRemaining, limits, usage }: BillingTabProps) => {
    const isNearTrialEnd = isTrial && trialDaysRemaining !== null && trialDaysRemaining <= 14 && trialDaysRemaining > 0;
    const isTrialExpired = isTrial && (trialDaysRemaining === null || trialDaysRemaining <= 0);

    return (
        <div className="space-y-8 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal" /> プラン・契約
            </h2>

            {/* 現在のプラン */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">現在のプラン</p>
                        <p className="text-2xl font-black text-slate-800">{planName}</p>
                    </div>
                    {isTrial && (
                        <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-center",
                            isTrialExpired ? "bg-rose-50" : isNearTrialEnd ? "bg-amber-50" : "bg-teal-50"
                        )}>
                            <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                isTrialExpired ? "text-rose-500" : isNearTrialEnd ? "text-amber-600" : "text-teal-600"
                            )}>
                                {isTrialExpired ? "トライアル終了" : "無料トライアル"}
                            </p>
                            <p className={cn(
                                "text-lg font-black tabular-nums",
                                isTrialExpired ? "text-rose-600" : isNearTrialEnd ? "text-amber-700" : "text-teal-700"
                            )}>
                                {isTrialExpired ? "期限切れ" : `残り${trialDaysRemaining}日`}
                            </p>
                        </div>
                    )}
                </div>

                {(isNearTrialEnd || isTrialExpired) && (
                    <div className="mt-5 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/marketing#pricing"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-teal text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all"
                        >
                            <Rocket className="w-4 h-4" />
                            プランを見る
                        </Link>
                        <a
                            href="mailto:info@signs-ai.jp?subject=プラン契約のご相談"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            相談する
                        </a>
                    </div>
                )}
            </div>

            {/* 利用状況 */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                    今月の利用状況
                </h3>
                <UsageRow icon={Building2} label="部署数" used={usage.departments} max={limits.maxDepartments} />
                <UsageRow icon={Target} label="KPI数" used={usage.kpis} max={limits.maxKpis} />
                <UsageRow icon={Users} label="メンバー数" used={usage.members} max={limits.maxMembers} />
                <UsageRow icon={Sparkles} label="AI分析の手動実行" used={usage.aiRunsUsed} max={limits.manualAiRuns} />
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold text-slate-500 leading-relaxed">
                プランの変更・請求に関するご相談は、上記の「相談する」または
                <a href="mailto:info@signs-ai.jp" className="text-teal underline mx-1">info@signs-ai.jp</a>
                までお気軽にご連絡ください。
            </div>
        </div>
    );
};
