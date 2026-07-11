"use client";

import { useRouter } from "next/navigation";
import { Send, Activity, Sparkles, TrendingUp, Thermometer, FileText, ChevronRight, CalendarDays, CircleCheck, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils/index";

type Role = string | null | undefined;
const isManagerUp = (r: Role) => r === "super_admin" || r === "admin" || r === "executive" || r === "manager";
const isAdmin = (r: Role) => r === "super_admin" || r === "admin";
const isExecUp = (r: Role) => r === "super_admin" || r === "admin" || r === "executive";

interface NextActionSectionProps {
    userRole: Role;
    company: any;
    displayDepts: any[];
    responseRate: number;
    surveyMonth?: string | null;
    surveyIsStale?: boolean;
    recentInsights: any[];
    onSectionChange?: (id: string) => void;
}

interface ActionDef {
    id: string;
    icon: any;
    title: string;
    desc: string;
    cta: string;
    priority: boolean;
    onClick: () => void;
}

/**
 * ホームの「今月の一手」セクション。
 * ナビを複製した旧クイックアクセスに代わり、組織の状態から「いま動かすと効くこと」を自動提案する。
 * カードの内容・件数・優先度・出し分けはデータとロールから決まる。
 */
export function NextActionSection({
    userRole,
    company,
    displayDepts,
    responseRate,
    surveyMonth,
    surveyIsStale,
    recentInsights,
    onSectionChange,
}: NextActionSectionProps) {
    const router = useRouter();

    const goSection = (id: string) => {
        onSectionChange?.(id);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── 状態の算出 ──
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 締切までの日数（回答期限日ベース）
    const deadlineDay = company?.survey_deadline_day || 20;
    const deadline = new Date(now.getFullYear(), now.getMonth(), deadlineDay);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    const deadlineLabel = daysLeft > 0 ? `締切まで${daysLeft}日` : daysLeft === 0 ? "締切は本日" : "締切超過";

    // 未入力KPIの部署数
    const unfilledCount = (displayDepts || []).filter((d) => d.hasKpiData === false).length;

    // 今月のAI診断が実行済みか
    const aiRunThisMonth = (recentInsights || []).some((i) => String(i?.created_at || "").slice(0, 7) === currentYM);

    // 回答率のラベル月（過去月フォールバック時は正直に）
    const surveyMonthNum = surveyMonth ? parseInt(surveyMonth.split("-")[1], 10) : null;
    const rateLabel = surveyIsStale && surveyMonthNum ? `${surveyMonthNum}月の回答率` : "今月の回答率";

    // ── アクション候補（visible なものだけ・priority 順） ──
    const candidates: (ActionDef & { visible: boolean })[] = [
        {
            id: "voice",
            icon: Send,
            title: "ボイスチェックを配布",
            desc: `${rateLabel}は ${responseRate}%。${deadlineLabel}です。`,
            cta: "配布画面を開く",
            priority: responseRate < 40,
            visible: isAdmin(userRole),
            onClick: () => router.push("/voice-check"),
        },
        {
            id: "kpi",
            icon: Activity,
            title: "未入力のKPIを入力",
            desc: `${unfilledCount}部署が今月まだ未入力です。`,
            cta: "KPI入力を開く",
            priority: false,
            visible: isManagerUp(userRole) && unfilledCount > 0,
            onClick: () => router.push("/kpi"),
        },
        {
            id: "ai",
            icon: Sparkles,
            title: "AI組織診断を実行",
            desc: "今月はまだ未実行です。回答が揃ったら実行しましょう。",
            cta: "診断を実行",
            priority: false,
            visible: isManagerUp(userRole) && !aiRunThisMonth,
            onClick: () => goSection("report"),
        },
        {
            id: "report",
            icon: TrendingUp,
            title: "先月からの変化を確認",
            desc: "全社の体温とKPIの動きをAIレポートで振り返ります。",
            cta: "レポートを見る",
            priority: false,
            visible: aiRunThisMonth,
            onClick: () => goSection("report"),
        },
        {
            id: "survey",
            icon: Thermometer,
            title: "組織の体温を見る",
            desc: "部署ごとのコンディションと設問別スコアを確認します。",
            cta: "体温を見る",
            priority: false,
            visible: true,
            onClick: () => goSection("survey"),
        },
        {
            id: "report-view",
            icon: FileText,
            title: "AI組織診断を見る",
            desc: "経営層向けの詳細分析レポートを開きます。",
            cta: "レポートを見る",
            priority: false,
            visible: !isManagerUp(userRole),
            onClick: () => goSection("report"),
        },
    ];

    const actions = candidates
        .filter((c) => c.visible)
        .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
        .slice(0, 4);

    // ── 月次ルーチンの進捗（KPI入力 → ボイスチェック → AI診断） ──
    const kpiDone = unfilledCount === 0 && (displayDepts || []).length > 0;
    const voiceDone = responseRate >= 40;
    const steps = [
        { label: "KPIを入力", done: kpiDone },
        { label: "ボイスチェックを配布", done: voiceDone },
        { label: "AI組織診断を実行", done: aiRunThisMonth },
    ];
    const currentStepIdx = steps.findIndex((s) => !s.done);

    return (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-baseline justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800">今月の一手</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">組織の状態から、いま効くことを提案します</p>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                    <CalendarDays className="w-3.5 h-3.5" /> {now.getFullYear()}年{now.getMonth() + 1}月・{deadlineLabel}
                </span>
            </div>

            {/* 月次ルーチンの進捗 */}
            {isManagerUp(userRole) && (
                <div className="bg-slate-50/70 rounded-2xl px-4 py-3 flex items-center flex-wrap gap-x-2 gap-y-1 mb-4">
                    <span className="text-[11px] text-slate-500 mr-1">月次ルーチン</span>
                    {steps.map((s, i) => (
                        <span key={s.label} className="flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1.5 text-[12px]",
                                s.done ? "text-emerald-600" : i === currentStepIdx ? "text-teal font-bold" : "text-slate-400"
                            )}>
                                {s.done ? <CircleCheck className="w-3.5 h-3.5" /> : i === currentStepIdx ? <CircleDot className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                {s.label}
                            </span>
                            {i < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        </span>
                    ))}
                </div>
            )}

            {/* アクションカード */}
            <div className="grid grid-cols-1 gap-3">
                {actions.map((a) => (
                    <div
                        key={a.id}
                        className={cn(
                            "rounded-2xl p-4 bg-white transition-colors",
                            a.priority ? "border-2 border-teal/40" : "border border-slate-100"
                        )}
                    >
                        {a.priority && (
                            <span className="inline-block text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-md mb-2.5">最優先</span>
                        )}
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                a.priority ? "bg-teal/10 text-teal" : "bg-slate-50 text-slate-500 border border-slate-100"
                            )}>
                                <a.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-800">{a.title}</div>
                                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{a.desc}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={a.onClick}
                                className={cn(
                                    "inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all",
                                    a.priority
                                        ? "bg-teal text-white hover:bg-teal/90"
                                        : "text-slate-600 border border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {a.cta} <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                すべての機能はサイドバーから開けます。ここは「次の一手」に集中しています。
            </p>
        </section>
    );
}
