"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UserCircle, Thermometer, TrendingUp, TrendingDown, Minus, Calendar, Sparkles, ArrowRight, MessageCircle } from "lucide-react";

interface MonthlyScore {
    month: string;     // YYYY-MM
    label: string;     // 表示用ラベル
    avg: number | null;
    answerCount: number;
}

export default function MyPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState<string>("");
    const [hasDepartment, setHasDepartment] = useState(false);
    const [monthlyScores, setMonthlyScores] = useState<MonthlyScore[]>([]);
    const [totalCompanyResponses, setTotalCompanyResponses] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("ログインが必要です"); return; }

            // ユーザー情報
            const { data: profile } = await supabase
                .from('users')
                .select('display_name, company_id, department_id')
                .eq('id', user.id)
                .single();

            if (!profile) { setError("ユーザー情報を取得できません"); return; }
            setUserName(profile.display_name || (user.email?.split('@')[0] ?? "あなた"));
            setHasDepartment(!!profile.department_id);

            // 過去6ヶ月の月リストを生成（YYYY-MM）
            const now = new Date();
            const months: { ym: string; label: string }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push({ ym, label: `${d.getMonth() + 1}月` });
            }

            // 自分の survey_responses（過去6ヶ月）
            const { data: responses } = await supabase
                .from('survey_responses')
                .select('id, recorded_month')
                .eq('user_id', user.id)
                .in('recorded_month', months.map(m => m.ym));

            // 回答スコア取得
            const responseIds = (responses || []).map(r => r.id);
            const { data: answers } = responseIds.length > 0
                ? await supabase
                    .from('survey_answers')
                    .select('response_id, score')
                    .in('response_id', responseIds)
                : { data: [] };

            // 月別集計
            const scoresByMonth: Record<string, number[]> = {};
            (responses || []).forEach(r => {
                const monthAnswers = (answers || []).filter(a => a.response_id === r.id);
                if (!scoresByMonth[r.recorded_month]) scoresByMonth[r.recorded_month] = [];
                monthAnswers.forEach(a => scoresByMonth[r.recorded_month].push(a.score));
            });

            const monthly: MonthlyScore[] = months.map(m => {
                const scores = scoresByMonth[m.ym] || [];
                const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
                return {
                    month: m.ym,
                    label: m.label,
                    avg: avg !== null ? Number(avg.toFixed(2)) : null,
                    answerCount: scores.length,
                };
            });
            setMonthlyScores(monthly);

            // 全社レスポンス数（参考指標）
            if (profile.company_id) {
                const { count } = await supabase
                    .from('survey_responses')
                    .select('id', { count: 'exact', head: true })
                    .eq('company_id', profile.company_id);
                setTotalCompanyResponses(count || 0);
            }
        } catch (e: any) {
            setError(e?.message || "データの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen message="マイページを読み込んでいます..." />;

    // 最新月のスコアと前月比較
    const latest = [...monthlyScores].reverse().find(m => m.avg !== null);
    const prev = (() => {
        if (!latest) return null;
        const idx = monthlyScores.findIndex(m => m.month === latest.month);
        for (let i = idx - 1; i >= 0; i--) {
            if (monthlyScores[i].avg !== null) return monthlyScores[i];
        }
        return null;
    })();
    const diff = latest && prev && latest.avg !== null && prev.avg !== null
        ? Number((latest.avg - prev.avg).toFixed(2))
        : null;

    // 状態バッジ
    const statusBadge = (score: number | null) => {
        if (score === null) return { label: "未回答", className: "bg-slate-100 text-slate-400" };
        if (score >= 4.0) return { label: "良好", className: "bg-emerald-50 text-emerald-600" };
        if (score >= 3.0) return { label: "安定", className: "bg-sky-50 text-sky-600" };
        if (score >= 2.0) return { label: "要注意", className: "bg-amber-50 text-amber-600" };
        return { label: "要サポート", className: "bg-rose-50 text-rose-500" };
    };
    const status = statusBadge(latest?.avg ?? null);

    return (
        <AppLayout>
            <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
                {/* ヘッダー */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3 mb-2">
                        <UserCircle className="w-7 h-7 text-teal" />
                        マイページ
                    </h1>
                    <p className="text-slate-500 font-medium">
                        こんにちは、<span className="font-black text-slate-700">{userName}</span> さん
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold">
                        {error}
                    </div>
                )}

                {!hasDepartment ? (
                    <EmptyState
                        title="部署に所属していません"
                        description="マイページのコンテンツは、部署に所属したメンバーに向けて表示されます。管理者にお問い合わせください。"
                        icon={<UserCircle className="w-12 h-12 text-slate-200" />}
                    />
                ) : (
                    <>
                        {/* ① 最新の状態カード */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Thermometer className="w-4 h-4" /> あなたの最新の状態
                                </h2>
                                <Badge className={`${status.className} border-none text-[10px] font-black px-3 py-1`}>
                                    {status.label}
                                </Badge>
                            </div>

                            {latest ? (
                                <div className="flex items-end gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">総合スコア</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-800 tracking-tighter">{latest.avg?.toFixed(1)}</span>
                                            <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                                        </div>
                                    </div>
                                    {diff !== null && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {diff > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                : diff < 0 ? <TrendingDown className="w-4 h-4 text-rose-500" />
                                                : <Minus className="w-4 h-4 text-slate-400" />}
                                            <span className={`text-sm font-black ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {diff > 0 ? '+' : ''}{diff} 前回比
                                            </span>
                                        </div>
                                    )}
                                    <div className="ml-auto text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">最新回答月</p>
                                        <p className="text-sm font-black text-slate-700">{latest.month}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 font-bold">まだボイスチェックの回答履歴がありません。下のボタンから回答してみましょう。</p>
                            )}
                        </div>

                        {/* ② 推移グラフ */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <TrendingUp className="w-4 h-4" /> 状態の推移（過去6ヶ月）
                            </h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyScores}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                                        <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                                            formatter={(v: any) => v !== null ? [`${v}`, 'スコア'] : ['未回答', '']}
                                        />
                                        <Line type="monotone" dataKey="avg" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5, fill: '#14b8a6' }} connectNulls />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-2">※ 未回答の月はグラフ上で線がスキップされます</p>
                        </div>

                        {/* ③ 次回ボイスチェック動線 */}
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl p-8">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-sm font-black text-teal-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4" /> 次回のボイスチェック
                                    </h2>
                                    <p className="text-sm font-bold text-slate-700">
                                        あなたの声が、組織の改善につながります。今月のボイスチェックに回答しましょう。
                                    </p>
                                </div>
                                <Link
                                    href="/form"
                                    className="bg-teal text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 flex items-center gap-2 shrink-0"
                                >
                                    回答する <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* ④ 影響メッセージ */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4" /> あなたの声が組織を変えています
                            </h2>
                            <p className="text-sm text-slate-600 font-bold leading-relaxed">
                                これまでに、あなたを含む社員の声が <span className="text-2xl font-black text-teal mx-1">{totalCompanyResponses.toLocaleString()}</span> 件、
                                組織改善のために活用されています。
                            </p>
                            <p className="text-[11px] text-slate-400 font-bold mt-3 flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5" />
                                ボイスチェックは匿名で集計され、経営層やマネージャーが改善アクションを検討する材料になっています。
                            </p>
                        </div>
                    </>
                )}
            </main>
        </AppLayout>
    );
}
