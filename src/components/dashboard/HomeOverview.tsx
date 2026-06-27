"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { SparkLine } from "@/components/dashboard/SparkLine";
import { QuickAccessGrid } from "@/components/dashboard/home/QuickAccessGrid";
import { Badge } from "@/components/ui/Badge";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { getWeatherFromPulse } from "@/lib/logic/kpi-engine";
import { cn } from "@/lib/utils/index";
import {
    Sparkles,
    Target,
    Thermometer,
    Shield,
    Building2,
    CheckCircle2,
    Clock,
    CalendarDays,
    ChevronRight,
    Info,
    MessageSquareText,
} from "lucide-react";

const isExecUp = (r?: string | null) => r === "super_admin" || r === "admin" || r === "executive";
const isManagerUp = (r?: string | null) =>
    r === "super_admin" || r === "admin" || r === "executive" || r === "manager";
const isAdmin = (r?: string | null) => r === "super_admin" || r === "admin";

interface FocusEntry {
    month: string;
    title: string;
    content: string;
}

interface PublicKpi {
    id: string;
    name: string;
    unit: string | null;
    history: number[];
    latest: number | null;
    target: number | null;
}

interface HomeOverviewProps {
    company: any;
    userRole?: string | null;
    userDepartmentId?: string | null;
    displayDepts: any[];
    overallPulse: number;
    overallTrend: "up" | "down" | "flat";
    overallComment: string;
    primaryKpi: any;
    primaryKpiAch: number | null;
    riskLevel: string;
    responseRate: number;
    responseCount: number;
    recentInsights: any[];
    actions: any[];
    onSectionChange?: (id: string) => void;
}

export function HomeOverview({
    company,
    userRole,
    userDepartmentId,
    displayDepts,
    overallPulse,
    overallTrend,
    overallComment,
    primaryKpi,
    primaryKpiAch,
    riskLevel,
    responseRate,
    responseCount,
    recentInsights,
    actions,
    onSectionChange,
}: HomeOverviewProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { canUse } = usePlanFeatures();
    const isPro = canUse("labor_analytics");

    const [currentFocus, setCurrentFocus] = useState<FocusEntry | null>(null);
    const [publicKpis, setPublicKpis] = useState<PublicKpi[]>([]);

    const execView = isManagerUp(userRole);
    const myDept = userDepartmentId ? displayDepts.find((d) => d.id === userDepartmentId) : null;

    // ヒーロー：マネージャー以上は全社体温、一般社員は自部署体温
    const heroPulse = execView ? overallPulse : (myDept?.pulse ?? 0);
    const heroWeather = getWeatherFromPulse(heroPulse) as "sun" | "cloud" | "rain";
    const heroTitle = execView ? "全社" : (myDept?.name || "あなたの組織");
    const heroComment = execView
        ? overallComment
        : heroPulse > 0
            ? `現在「${heroTitle}」の体温は${heroPulse >= 4 ? "良好な" : heroPulse >= 3 ? "標準的な" : "やや低めの"}水準です。詳しい分析はAI組織診断から確認できます。`
            : "まだ回答データが蓄積されていません。アンケートが集まると、ここに組織の状態が表示されます。";

    // 当月（YYYY-MM）と直近6ヶ月（YYYY-MM-01）
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

    useEffect(() => {
        if (!company?.id) return;
        let cancelled = false;

        const fetchHomeData = async () => {
            const months: { ym: string; firstDay: string; label: string }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                months.push({ ym, firstDay: `${ym}-01`, label: `${d.getMonth() + 1}月` });
            }

            // ① 今月の経営課題（最新）
            const { data: focusData } = await supabase
                .from("executive_monthly_focus")
                .select("month, title, content")
                .eq("company_id", company.id)
                .order("month", { ascending: false })
                .limit(1);
            if (!cancelled) {
                setCurrentFocus(focusData && focusData.length > 0 ? focusData[0] : null);
            }

            // ② 公開KPI（is_public_to_players=true / axis_id IS NULL / YYYY-MM-01）
            const { data: kpis } = await supabase
                .from("kpi_definitions")
                .select("id, name, unit")
                .eq("company_id", company.id)
                .eq("is_public_to_players", true)
                .order("sort_order", { ascending: true });

            const kpiIds = (kpis || []).map((k: any) => k.id);
            const { data: records } = kpiIds.length > 0
                ? await supabase
                    .from("kpi_records")
                    .select("kpi_definition_id, recorded_month, value, target_value")
                    .in("kpi_definition_id", kpiIds)
                    .in("recorded_month", months.map((m) => m.firstDay))
                    .is("axis_id", null)
                : { data: [] };

            const byKpi: Record<string, any[]> = {};
            (records || []).forEach((r: any) => {
                if (!r.kpi_definition_id) return;
                (byKpi[r.kpi_definition_id] ||= []).push(r);
            });

            const formatted: PublicKpi[] = (kpis || []).map((k: any) => {
                const history = months.map((m) => {
                    const rec = (byKpi[k.id] || []).find((r) => r.recorded_month === m.firstDay);
                    return rec?.value ?? null;
                });
                const latestRec = [...months].reverse()
                    .map((m) => (byKpi[k.id] || []).find((r) => r.recorded_month === m.firstDay))
                    .find((r) => r && r.value !== null);
                return {
                    id: k.id,
                    name: k.name,
                    unit: k.unit,
                    history: history.map((v) => (v == null ? 0 : v)),
                    latest: latestRec?.value ?? null,
                    target: latestRec?.target_value ?? null,
                };
            });
            if (!cancelled) setPublicKpis(formatted.slice(0, 4));
        };

        fetchHomeData();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company?.id]);

    const formatKpiValue = (v: number | null, unit: string | null) => {
        if (v === null) return "—";
        const noComma = ["年", "ID", "%"];
        if (unit && noComma.includes(unit)) return `${v}${unit || ""}`;
        return `${v.toLocaleString()}${unit || ""}`;
    };

    const openActions = (actions || []).filter((a) => a.status !== "done").slice(0, 3);

    const riskMeta =
        riskLevel === "high"
            ? { label: "高（要警戒）", dot: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50/40 border-rose-200" }
            : riskLevel === "medium"
                ? { label: "中（要観察）", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/40 border-amber-200" }
                : { label: "低（安全）", dot: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50/50 border-slate-100" };

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* ヘッダー挨拶 */}
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                    <p className="text-[11px] font-black text-teal uppercase tracking-widest mb-1">{monthLabel}</p>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2.5">
                        <Thermometer className="w-7 h-7 text-teal" />
                        組織の温度
                    </h1>
                </div>
                <button
                    onClick={() => onSectionChange?.("report")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    AI組織診断を見る
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ===== 左：メインカラム ===== */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 経営サマリー（経営者・管理者専用ブロック） */}
                    {isExecUp(userRole) && (
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> 経営サマリー
                                </h2>
                                <Badge className="bg-slate-900 text-white border-none text-[9px] font-black px-2 py-0.5 tracking-widest">
                                    経営層向け
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <Thermometer className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">全体体温</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-lg font-black text-slate-800">{overallPulse > 0 ? overallPulse.toFixed(1) : "—"}</span>
                                            <span className="text-[10px] font-bold text-slate-400">/ 5.0</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <Target className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                                            主要KPI達成率{primaryKpi ? `（${primaryKpi.name}）` : ""}
                                        </p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-lg font-black text-slate-800">
                                                {primaryKpiAch !== null ? `${primaryKpiAch}%` : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl border", riskMeta.bg)}>
                                    <div className="w-9 h-9 rounded-xl bg-white/60 border border-slate-100 flex items-center justify-center shrink-0">
                                        <Shield className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">組織リスク</p>
                                        <div className="mt-1 flex items-center">
                                            <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold", riskMeta.text)}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", riskMeta.dot)} />
                                                {riskMeta.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 組織の体温ヒーロー */}
                    <MainInsightCard
                        title={heroTitle}
                        tone={execView ? "戦略的分析" : "あなたの組織"}
                        text={heroComment}
                        weather={heroWeather}
                        trend={overallTrend}
                        onOpenDeepReport={() => onSectionChange?.("report")}
                    />

                    {/* 今月の経営課題 */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" /> 今月の経営課題
                            </h2>
                            {isExecUp(userRole) && (
                                <button
                                    onClick={() => router.push("/monthly-focus")}
                                    className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                                >
                                    編集 <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {currentFocus ? (
                            <>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] font-black px-2 py-0.5">
                                        {currentFocus.month}
                                    </Badge>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{currentFocus.title}</h3>
                                </div>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4">
                                    {currentFocus.content}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 font-bold">経営層からの今月の課題はまだ登録されていません。</p>
                        )}
                    </section>

                    {/* KPIハイライト */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-4 h-4" /> 会社の主要指標
                            </h2>
                            <button
                                onClick={() => onSectionChange?.("kpi")}
                                className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                            >
                                KPI推移を見る <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        {publicKpis.length === 0 ? (
                            <p className="text-sm text-slate-400 font-bold">公開設定されている指標はまだありません。</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {publicKpis.map((kpi) => (
                                    <div key={kpi.id} className="border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[13px] font-black text-slate-600 mb-2">{kpi.name}</p>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                                {formatKpiValue(kpi.latest, kpi.unit)}
                                            </span>
                                            {kpi.target !== null && (
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    / 目標 {formatKpiValue(kpi.target, kpi.unit)}
                                                </span>
                                            )}
                                        </div>
                                        <SparkLine data={kpi.history} color="#14b8a6" height={36} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 部署の状態（マネージャー以上） */}
                    {isManagerUp(userRole) && displayDepts.length > 0 && (
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> 部署の状態
                                </h2>
                                <button
                                    onClick={() => router.push("/dept")}
                                    className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                                >
                                    部署マネジメント <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {displayDepts.slice(0, 4).map((d) => (
                                    <OrganizationCard
                                        key={d.id}
                                        name={d.name}
                                        head={d.head}
                                        pulse={d.pulse}
                                        weather={d.weather}
                                        arrow={d.arrow}
                                        kpis={d.kpis}
                                        laborCostPerHead={d.laborCostPerHead}
                                        isStale={d.isStale}
                                        dataMonth={d.dataMonth}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* ===== 右：サイドレール ===== */}
                <div className="space-y-6">
                    <QuickAccessGrid userRole={userRole} isPro={isPro} onSectionChange={onSectionChange} />

                    {/* アクション（マネージャー以上） */}
                    {isManagerUp(userRole) && (
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> アクション
                                    {openActions.length > 0 && (
                                        <Badge className="bg-teal/10 text-teal border-none text-[10px] font-black px-1.5 py-0">
                                            {openActions.length}
                                        </Badge>
                                    )}
                                </h2>
                                <button
                                    onClick={() => onSectionChange?.("action")}
                                    className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                                >
                                    すべて <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            {openActions.length === 0 ? (
                                <p className="text-[13px] text-slate-400 font-bold">未対応のアクションはありません。</p>
                            ) : (
                                <div className="space-y-2">
                                    {openActions.map((a) => (
                                        <div key={a.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                                a.priority === "high" ? "bg-rose-500" : a.priority === "medium" ? "bg-amber-500" : "bg-slate-300"
                                            )} />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-slate-700 leading-snug line-clamp-2">{a.title}</p>
                                                {a.is_ai_generated && (
                                                    <span className="text-[9px] font-black text-teal uppercase tracking-widest">AI提案</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ボイスチェック状況（管理者） */}
                    {isAdmin(userRole) && (
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquareText className="w-4 h-4" /> ボイスチェック
                                </h2>
                                <button
                                    onClick={() => router.push("/voice-check")}
                                    className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                                >
                                    管理 <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-black text-slate-800 tracking-tighter">{responseRate}%</span>
                                <span className="text-[13px] text-slate-400 font-bold mb-1">回答率（{currentYM}）</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                                <div className="h-full rounded-full bg-teal transition-all duration-1000" style={{ width: `${Math.min(responseRate, 100)}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-2">今月の回答 {responseCount}件</p>
                        </section>
                    )}

                    {/* 最近の動き */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> 最近の動き
                            </h2>
                            <button
                                onClick={() => router.push("/history")}
                                className="text-[10px] font-black text-slate-400 hover:text-teal uppercase tracking-widest flex items-center gap-1"
                            >
                                履歴 <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        {(!recentInsights || recentInsights.length === 0) ? (
                            <p className="text-[13px] text-slate-400 font-bold">まだ記録がありません。</p>
                        ) : (
                            <div className="space-y-2.5">
                                {recentInsights.slice(0, 4).map((ins) => (
                                    <div key={ins.id} className="flex items-start gap-2.5">
                                        <CalendarDays className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-bold text-slate-600 leading-snug">
                                                {ins.insight_type === "full_report" ? "AI組織診断を更新"
                                                    : ins.insight_type === "hr_strategy" ? "人事戦略インサイトを更新"
                                                        : "AIインサイトを更新"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                {new Date(ins.created_at).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                                                {ins.target_month ? ` ・ ${ins.target_month}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 公開範囲の注記（一般社員向け） */}
                    {!execView && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                体温・KPIは経営層が「全社員に公開」と指定した範囲のみ表示されます。3名未満の集計はプライバシー保護のため非表示です。
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
