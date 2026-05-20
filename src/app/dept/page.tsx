"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    Building2,
    TrendingUp,
    TrendingDown,
    Minus,
    Info,
    Users,
    ChevronRight,
    HelpCircle,
    Activity,
    ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface DeptMonthlyScore {
    month: string;     // YYYY-MM
    label: string;
    avg: number | null;
    respondentCount: number;
}

interface QuestionScore {
    questionId: string;
    text: string;
    avg: number | null;
}

export default function DeptDashboardPage() {
    const supabase = createClient();
    const router = useRouter();

    const [roleLoading, setRoleLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userRole, setUserRole] = useState<string>("player");
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [departmentId, setDepartmentId] = useState<string | null>(null);
    const [departmentName, setDepartmentName] = useState<string>("");

    const [deptScores, setDeptScores] = useState<DeptMonthlyScore[]>([]);
    const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);

    useEffect(() => {
        checkRoleAndFetchData();
    }, []);

    const checkRoleAndFetchData = async () => {
        try {
            setRoleLoading(true);
            setLoading(true);

            // 認証確認
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // ユーザー情報およびロール・所属部署の確認
            const { data: profile } = await supabase
                .from('users')
                .select('company_id, department_id, role, departments(name)')
                .eq('id', user.id)
                .single();

            if (!profile) {
                setError("ユーザープロファイルを取得できませんでした");
                setRoleLoading(false);
                setLoading(false);
                return;
            }

            // ロール制御: player はアクセス不可、強制リダイレクト
            if (profile.role === "player") {
                toast.error("このページへのアクセス権限がありません");
                router.push("/");
                return;
            }

            setUserRole(profile.role);
            setRoleLoading(false); // ロール確認完了

            if (!profile.company_id) {
                setError("会社情報が設定されていません");
                setLoading(false);
                return;
            }

            setCompanyId(profile.company_id);
            setDepartmentId(profile.department_id);
            setDepartmentName((profile as any).departments?.name || "");

            // 部署未所属の場合はローディング終了（EmptyStateを表示するため）
            if (!profile.department_id) {
                setLoading(false);
                return;
            }

            // ── 過去6ヶ月の月リスト生成 ──
            const now = new Date();
            const months: { ym: string; label: string }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push({
                    ym,
                    label: `${d.getMonth() + 1}月`,
                });
            }

            // ── 過去6ヶ月の範囲で responses を取得 ──
            const targetYMs = months.map(m => m.ym);

            // 1. survey_responses 取得
            const { data: responses, error: responseErr } = await supabase
                .from('survey_responses')
                .select('id, recorded_month')
                .eq('company_id', profile.company_id)
                .eq('department_id', profile.department_id)
                .in('recorded_month', targetYMs);

            if (responseErr) throw responseErr;

            const responsesByMonth: Record<string, string[]> = {};
            (responses || []).forEach(r => {
                if (!responsesByMonth[r.recorded_month]) responsesByMonth[r.recorded_month] = [];
                responsesByMonth[r.recorded_month].push(r.id);
            });

            // 2. survey_answers 取得
            const allResponseIds = (responses || []).map(r => r.id);
            const { data: answers, error: answerErr } = allResponseIds.length > 0
                ? await supabase
                    .from('survey_answers')
                    .select('response_id, question_id, score')
                    .in('response_id', allResponseIds)
                : { data: [], error: null };

            if (answerErr) throw answerErr;

            const answerByResponse: Record<string, { questionId: string; score: number }[]> = {};
            (answers || []).forEach(a => {
                if (!a.response_id || !a.question_id) return;
                if (!answerByResponse[a.response_id]) answerByResponse[a.response_id] = [];
                answerByResponse[a.response_id].push({
                    questionId: a.question_id,
                    score: a.score,
                });
            });

            // 3. 過去6ヶ月分の月別総合スコア集計
            const scored: DeptMonthlyScore[] = months.map(m => {
                const ids = responsesByMonth[m.ym] || [];
                const respondentCount = ids.length;
                const allScores: number[] = [];
                ids.forEach(rid => {
                    (answerByResponse[rid] || []).forEach(ans => allScores.push(ans.score));
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

            // 部署スコアステートへ設定
            setDeptScores(scored);

            // 5. 設問一覧の取得（company_id フィルタ必須）
            const { data: questions, error: questionErr } = await supabase
                .from('survey_questions')
                .select('id, text, sort_order')
                .eq('company_id', profile.company_id)
                .order('sort_order', { ascending: true });

            if (questionErr) throw questionErr;

            // 6. 今月の設問別平均スコア集計
            const currentYM = months[months.length - 1].ym;
            const currentResponseIds = responsesByMonth[currentYM] || [];

            const qScores: QuestionScore[] = (questions || []).map(q => {
                const scoresForQ: number[] = [];
                currentResponseIds.forEach(rid => {
                    const ansList = answerByResponse[rid] || [];
                    ansList.forEach(ans => {
                        if (ans.questionId === q.id) {
                            scoresForQ.push(ans.score);
                        }
                    });
                });
                const avg = scoresForQ.length > 0
                    ? Number((scoresForQ.reduce((s, v) => s + v, 0) / scoresForQ.length).toFixed(2))
                    : null;
                return {
                    questionId: q.id,
                    text: q.text,
                    avg,
                };
            });
            setQuestionScores(qScores);

        } catch (e: any) {
            setError(e?.message || "データの取得に失敗しました");
            toast.error(e?.message || "データの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    // ロール判定中は Loading コンポーネントを即座に返し、コンテンツの露出を防ぐ
    if (roleLoading) {
        return <Loading fullScreen message="アクセス権限を確認しています..." />;
    }

    // player はリダイレクトが発火するためコンテンツは描画しない
    if (userRole === "player") {
        return null;
    }

    if (loading) {
        return <Loading fullScreen message="部署のデータを読み込んでいます..." />;
    }

    // 今月のスコア情報
    const currentMonthScore = deptScores[deptScores.length - 1];
    // 前月のスコア情報（前月比計算用）
    const prevMonthScore = deptScores[deptScores.length - 2] || null;

    // 前月比の差分計算
    let diff: number | null = null;
    if (currentMonthScore && currentMonthScore.avg !== null && prevMonthScore && prevMonthScore.avg !== null) {
        diff = Number((currentMonthScore.avg - prevMonthScore.avg).toFixed(2));
    }

    const totalRespondents = deptScores.reduce((s, m) => s + m.respondentCount, 0);

    return (
        <AppLayout>
            <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
                {/* ヘッダー */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3 mb-2">
                        <Building2 className="w-7 h-7 text-teal" />
                        部署ダッシュボード
                    </h1>
                    <p className="text-slate-500 font-medium">
                        マネージャーとして、あなたの所属する部署のメンバー状態を多角的に把握・分析します。
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold animate-in fade-in">
                        {error}
                    </div>
                )}

                {!departmentId ? (
                    <EmptyState
                        title="部署に所属していません"
                        description="部署ダッシュボードは、部署に所属しているマネージャー・管理者に向けた機能です。"
                        icon={<Building2 className="w-12 h-12 text-slate-200" />}
                    />
                ) : (
                    <div className="space-y-8 animate-in fade-in">
                        {/* ① 今月の部署スコア（ヒーローカード） */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-teal-200/10 rounded-full blur-2xl" />
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-sm font-black text-teal-800 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> 今月の部署スコア
                                            {departmentName && (
                                                <Badge className="bg-teal-100 text-teal-800 border-none text-[10px] font-black px-2 py-0.5 ml-2">
                                                    {departmentName}
                                                </Badge>
                                            )}
                                        </h2>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600">
                                            <Users className="w-3.5 h-3.5" />
                                            累計回答 {totalRespondents}件
                                        </div>
                                    </div>

                                    {currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                                        <div className="space-y-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-6xl font-black text-slate-800 tracking-tighter">
                                                    <AnonymityGate count={currentMonthScore.respondentCount}>
                                                        {currentMonthScore.avg?.toFixed(2)}
                                                    </AnonymityGate>
                                                </span>
                                                <span className="text-lg font-bold text-slate-400">/ 5.00</span>

                                                {/* 前月比表示 */}
                                                {diff !== null && (
                                                    <div className="ml-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80 border border-teal-100/30">
                                                        {diff > 0 ? (
                                                            <>
                                                                <TrendingUp className="w-3.5 h-3.5 text-teal" />
                                                                <span className="text-teal">+{diff.toFixed(2)}</span>
                                                            </>
                                                        ) : diff < 0 ? (
                                                            <>
                                                                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                                                <span className="text-rose-500">{diff.toFixed(2)}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Minus className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="text-slate-400">±0.00</span>
                                                            </>
                                                        )}
                                                        <span className="text-[10px] text-slate-400 font-medium">前月比</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold">
                                                回答者数: {currentMonthScore.respondentCount}名（{currentMonthScore.month}）
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white/80 border border-teal-100 rounded-2xl p-5 flex items-center gap-3 mt-2">
                                            <Info className="w-4 h-4 text-teal-600 shrink-0" />
                                            <p className="text-xs text-teal-800 font-bold">
                                                今月はまだ集計表示できる回答数（{3}名以上）に達していません。
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 border-t border-teal-100/50 pt-4 flex items-center gap-2 text-[10px] text-teal-600 font-bold">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    回答者数が3名未満の月は、個人特定防止のため自動的に非表示処理（匿名ガード）が働きます。
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">メンバー分析ステータス</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-500 font-bold">集計ステータス</span>
                                            {currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                                                <Badge className="bg-teal text-white border-none font-bold text-[10px] px-2.5 py-1 rounded-lg">集計完了</Badge>
                                            ) : (
                                                <Badge className="bg-amber-500 text-white border-none font-bold text-[10px] px-2.5 py-1 rounded-lg">回答収集中</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-500 font-bold">今月の回答率目標</span>
                                            <span className="text-xs font-black text-slate-700">70% 以上</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-bold">匿名ガード閾値</span>
                                            <span className="text-xs font-black text-slate-700">3名未満で非表示</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold bg-slate-50 p-3.5 rounded-2xl flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                                    マネージャー向け画面は、自部署メンバーの総合動向のみが表示され、個別特定ができないよう制限されています。
                                </div>
                            </div>
                        </div>

                        {/* ② 過去6ヶ月の推移グラフ */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> 部署スコアの推移
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400">過去6ヶ月</span>
                            </div>

                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={deptScores.map(s => ({
                                        ...s,
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
                                        <Line
                                            type="monotone"
                                            dataKey="displayAvg"
                                            stroke="#14b8a6"
                                            strokeWidth={3}
                                            dot={{ r: 6, fill: '#14b8a6', strokeWidth: 2, stroke: '#ffffff' }}
                                            activeDot={{ r: 8 }}
                                            connectNulls={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-3 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                プライバシー保護のため、回答数が3名に満たない月はグラフ上で自動的に線がスキップされます。
                            </p>
                        </section>

                        {/* ③ 設問別スコア（今月） */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <ClipboardList className="w-4 h-4" /> 設問別詳細スコア（今月）
                            </h2>

                            {currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                                <div className="space-y-6">
                                    {questionScores.length === 0 ? (
                                        <p className="text-xs text-slate-400">設問データが登録されていません。</p>
                                    ) : (
                                        questionScores.map(qs => {
                                            const scoreVal = qs.avg !== null ? qs.avg : 0;
                                            // スコアに応じたカラーリング
                                            const isLow = scoreVal > 0 && scoreVal < 3.0;
                                            const isMid = scoreVal >= 3.0 && scoreVal < 4.0;
                                            const isHigh = scoreVal >= 4.0;

                                            return (
                                                <div key={qs.questionId} className="space-y-2 border-b border-slate-50 pb-4 last:border-none last:pb-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <span className="text-sm font-bold text-slate-700">{qs.text}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-black text-slate-800">{qs.avg !== null ? qs.avg.toFixed(2) : "—"}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">/ 5.00</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500`}
                                                            style={{
                                                                width: `${(scoreVal / 5) * 100}%`,
                                                                backgroundColor: isLow ? '#f43f5e' : isMid ? '#f59e0b' : isHigh ? '#14b8a6' : '#cbd5e1'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                                    <Info className="w-8 h-8 text-slate-400" />
                                    <h3 className="text-sm font-black text-slate-700">回答数が不足しているため詳細非表示</h3>
                                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                                        プライバシーと個人の匿名性を保護するため、今月の回答総数が3名未満の場合、設問ごとの詳細なスコアは一括してマスクされます。
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
