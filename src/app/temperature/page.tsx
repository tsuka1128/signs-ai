"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { AnonymityGate } from "@/components/ui/AnonymityGate";
import {
    passesAnonymityGuard,
    ANONYMITY_HIDDEN_REASON,
} from "@/lib/utils/anonymity";
import { createClient } from "@/lib/supabase";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Thermometer,
    Sparkles,
    TrendingUp,
    Target,
    Building2,
    Info,
    Calendar,
    Users,
} from "lucide-react";

interface DeptMonthlyScore {
    month: string;     // YYYY-MM
    label: string;
    avg: number | null;
    respondentCount: number;
}

interface PublicKpi {
    id: string;
    name: string;
    unit: string | null;
    is_higher_better: boolean | null;
    records: { month: string; label: string; value: number | null; target: number | null }[];
}

interface FocusEntry {
    month: string;
    title: string;
    content: string;
}

export default function TemperaturePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [companyId, setCompanyId] = useState<string | null>(null);
    const [departmentId, setDepartmentId] = useState<string | null>(null);
    const [departmentName, setDepartmentName] = useState<string>("");

    const [currentFocus, setCurrentFocus] = useState<FocusEntry | null>(null);
    const [pastFocus, setPastFocus] = useState<FocusEntry[]>([]);

    const [deptScores, setDeptScores] = useState<DeptMonthlyScore[]>([]);
    const [publicKpis, setPublicKpis] = useState<PublicKpi[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 認証
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("ログインが必要です"); return; }

            // ユーザー情報
            const { data: profile } = await supabase
                .from('users')
                .select('company_id, department_id, departments(name)')
                .eq('id', user.id)
                .single();
            if (!profile?.company_id) { setError("会社情報を取得できません"); return; }

            setCompanyId(profile.company_id);
            setDepartmentId(profile.department_id);
            setDepartmentName((profile as any).departments?.name || "");

            // ── 過去6ヶ月の月リスト ──
            const now = new Date();
            const months: { ym: string; label: string; firstDay: string }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push({
                    ym,
                    label: `${d.getMonth() + 1}月`,
                    firstDay: `${ym}-01`,
                });
            }
            const currentYM = months[months.length - 1].ym;

            // ── ① 今月の経営課題 ──
            const { data: focusData } = await supabase
                .from('executive_monthly_focus')
                .select('month, title, content')
                .eq('company_id', profile.company_id)
                .order('month', { ascending: false })
                .limit(7);
            const focusList = focusData || [];
            const current = focusList.find(f => f.month === currentYM)
                || focusList[0]
                || null;
            setCurrentFocus(current);
            setPastFocus(focusList.filter(f => f.month !== current?.month).slice(0, 6));

            // ── ② 自部署の状態（過去6ヶ月 × 月別平均、3名匿名ガード） ──
            if (profile.department_id) {
                const { data: responses } = await supabase
                    .from('survey_responses')
                    .select('id, recorded_month')
                    .eq('company_id', profile.company_id)
                    .eq('department_id', profile.department_id)
                    .in('recorded_month', months.map(m => m.ym));

                const responsesByMonth: Record<string, string[]> = {};
                (responses || []).forEach(r => {
                    if (!responsesByMonth[r.recorded_month]) responsesByMonth[r.recorded_month] = [];
                    responsesByMonth[r.recorded_month].push(r.id);
                });

                const allResponseIds = (responses || []).map(r => r.id);
                const { data: answers } = allResponseIds.length > 0
                    ? await supabase
                        .from('survey_answers')
                        .select('response_id, score')
                        .in('response_id', allResponseIds)
                    : { data: [] };

                const answerByResponse: Record<string, number[]> = {};
                (answers || []).forEach(a => {
                    if (!a.response_id) return;
                    if (!answerByResponse[a.response_id]) answerByResponse[a.response_id] = [];
                    answerByResponse[a.response_id].push(a.score);
                });

                const scored: DeptMonthlyScore[] = months.map(m => {
                    const ids = responsesByMonth[m.ym] || [];
                    const respondentCount = ids.length;
                    const allScores: number[] = [];
                    ids.forEach(rid => {
                        (answerByResponse[rid] || []).forEach(s => allScores.push(s));
                    });
                    const avg = allScores.length > 0
                        ? Number((allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(2))
                        : null;
                    return {
                        month: m.ym,
                        label: m.label,
                        avg,
                        respondentCount,
                    };
                });
                setDeptScores(scored);
            }

            // ── ③ 公開KPI（is_public_to_players=true） ──
            const { data: kpis } = await supabase
                .from('kpi_definitions')
                .select('id, name, unit, is_higher_better')
                .eq('company_id', profile.company_id)
                .eq('is_public_to_players', true)
                .order('sort_order', { ascending: true });

            const kpiIds = (kpis || []).map(k => k.id);
            const { data: records } = kpiIds.length > 0
                ? await supabase
                    .from('kpi_records')
                    .select('kpi_definition_id, recorded_month, value, target_value')
                    .in('kpi_definition_id', kpiIds)
                    .in('recorded_month', months.map(m => m.firstDay))
                    .is('axis_id', null)
                : { data: [] };

            const recordsByKpi: Record<string, any[]> = {};
            (records || []).forEach(r => {
                if (!r.kpi_definition_id) return;
                if (!recordsByKpi[r.kpi_definition_id]) recordsByKpi[r.kpi_definition_id] = [];
                recordsByKpi[r.kpi_definition_id].push(r);
            });

            const formattedKpis: PublicKpi[] = (kpis || []).map((k: any) => ({
                id: k.id,
                name: k.name,
                unit: k.unit,
                is_higher_better: k.is_higher_better,
                records: months.map(m => {
                    const rec = (recordsByKpi[k.id] || []).find(r => r.recorded_month === m.firstDay);
                    return {
                        month: m.ym,
                        label: m.label,
                        value: rec?.value ?? null,
                        target: rec?.target_value ?? null,
                    };
                }),
            }));
            setPublicKpis(formattedKpis);

        } catch (e: any) {
            setError(e?.message || "データの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen message="組織の温度を読み込んでいます..." />;

    const currentMonthScore = deptScores[deptScores.length - 1];
    const totalRespondents = deptScores.reduce((s, m) => s + m.respondentCount, 0);

    const formatKpiValue = (v: number | null, unit: string | null) => {
        if (v === null) return "—";
        const noCommaUnits = ["年", "ID", "%"];
        if (unit && noCommaUnits.includes(unit)) return `${v}${unit || ''}`;
        return `${v.toLocaleString()}${unit || ''}`;
    };

    return (
        <AppLayout>
            <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
                {/* ヘッダー */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3 mb-2">
                        <Thermometer className="w-7 h-7 text-teal" />
                        組織の温度
                    </h1>
                    <p className="text-slate-500 font-medium">
                        経営層の方針、あなたの部署の状態、会社の主要指標を確認できます。
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold">
                        {error}
                    </div>
                )}

                {/* ① 今月の経営課題 */}
                <section className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 rounded-3xl p-8">
                    <h2 className="text-sm font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4" /> 今月の経営課題
                    </h2>
                    {currentFocus ? (
                        <>
                            <div className="flex items-baseline gap-3 mb-3">
                                <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-black px-2 py-0.5">
                                    {currentFocus.month}
                                </Badge>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{currentFocus.title}</h3>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                {currentFocus.content}
                            </p>
                            {pastFocus.length > 0 && (
                                <details className="mt-6 group">
                                    <summary className="cursor-pointer text-[11px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest list-none flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        過去の経営課題（{pastFocus.length}件）
                                    </summary>
                                    <div className="mt-4 space-y-2">
                                        {pastFocus.map(f => (
                                            <div key={f.month} className="bg-white/60 border border-amber-100 rounded-2xl px-5 py-3">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{f.month}</span>
                                                    <span className="text-sm font-black text-slate-800">{f.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 font-medium line-clamp-2">{f.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 font-bold">経営層からの今月の課題はまだ登録されていません。</p>
                    )}
                </section>

                {/* ② 自部署の状態 */}
                {departmentId ? (
                    <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> 自部署の状態
                                {departmentName && (
                                    <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-black px-2 py-0.5 ml-2">
                                        {departmentName}
                                    </Badge>
                                )}
                            </h2>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Users className="w-3 h-3" />
                                累計回答 {totalRespondents}件
                            </div>
                        </div>

                        {/* 今月のスコア */}
                        {currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                            <div className="mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">今月の総合スコア</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                        <AnonymityGate count={currentMonthScore.respondentCount}>
                                            {currentMonthScore.avg?.toFixed(1)}
                                        </AnonymityGate>
                                    </span>
                                    <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold mt-1">
                                    回答者数: {currentMonthScore.respondentCount}名（{currentMonthScore.month}）
                                </p>
                            </div>
                        ) : (
                            <div className="mb-8 bg-slate-50 px-5 py-4 rounded-2xl flex items-center gap-3">
                                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                <p className="text-xs text-slate-500 font-bold">
                                    今月はまだ集計表示できる回答数（{3}名以上）に達していません。
                                </p>
                            </div>
                        )}

                        {/* 推移グラフ */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" /> 過去6ヶ月の推移
                            </p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={deptScores.map(s => ({
                                        ...s,
                                        // 匿名ガードに引っかかった月は null にして線をスキップ
                                        displayAvg: passesAnonymityGuard(s.respondentCount) ? s.avg : null,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                                        <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                                            formatter={(v: any, _name: any, props: any) => {
                                                const d = props?.payload;
                                                if (!passesAnonymityGuard(d?.respondentCount || 0)) {
                                                    return ['非表示', ANONYMITY_HIDDEN_REASON];
                                                }
                                                return v !== null ? [`${v}`, `スコア（${d.respondentCount}名）`] : ['未集計', ''];
                                            }}
                                        />
                                        <Line type="monotone" dataKey="displayAvg" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5, fill: '#14b8a6' }} connectNulls={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                3名未満の月はプライバシー保護のため非表示
                            </p>
                        </div>
                    </section>
                ) : (
                    <EmptyState
                        title="部署に所属していません"
                        description="自部署の集計結果は、部署に所属したメンバーに向けて表示されます。"
                        icon={<Building2 className="w-12 h-12 text-slate-200" />}
                    />
                )}

                {/* ③ 公開KPI */}
                <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                        <Target className="w-4 h-4" /> 会社の主要指標
                    </h2>
                    {publicKpis.length === 0 ? (
                        <p className="text-sm text-slate-500 font-bold">公開設定されている指標はまだありません。</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {publicKpis.map(kpi => {
                                const latest = [...kpi.records].reverse().find(r => r.value !== null);
                                return (
                                    <div key={kpi.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50/50 transition-colors">
                                        <p className="text-sm font-black text-slate-700 mb-3">{kpi.name}</p>
                                        {latest ? (
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                                    {formatKpiValue(latest.value, kpi.unit)}
                                                </span>
                                                {latest.target !== null && (
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        / 目標 {formatKpiValue(latest.target, kpi.unit)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold mb-3">未入力</p>
                                        )}
                                        <div className="h-20">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={kpi.records}>
                                                    <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={false} connectNulls />
                                                    <XAxis dataKey="label" stroke="#cbd5e1" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                                                        formatter={(v: any) => v !== null ? [formatKpiValue(v, kpi.unit), '実績'] : ['未入力', '']}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <p className="text-[11px] text-slate-400 font-bold mt-4 flex items-center gap-1.5">
                        <Info className="w-3 h-3" />
                        経営層が「全社員に公開」と指定したKPIのみ表示されます
                    </p>
                </section>
            </main>
        </AppLayout>
    );
}
