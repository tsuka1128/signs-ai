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
    Building2,
    Info,
    ChevronRight,
    ClipboardList,
    Inbox,
    Lock,
    Bookmark
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

    const [userId, setUserId] = useState<string | null>(null);
    const [note, setNote] = useState<string>("");
    const [savingNote, setSavingNote] = useState<boolean>(false);
    const [currentFocus, setCurrentFocus] = useState<any>(null);
    const [pastFocus, setPastFocus] = useState<any[]>([]);

    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [deptLoading, setDeptLoading] = useState<boolean>(false);

    useEffect(() => {
        checkRoleAndInit();
    }, []);

    useEffect(() => {
        if (selectedDepartmentId && companyId) {
            fetchDeptData(selectedDepartmentId);
        }
    }, [selectedDepartmentId, companyId]);

    const checkRoleAndInit = async () => {
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
            setUserId(user.id);

            // 部署リスト取得（上位ロールのみ）
            let initialDeptId: string | null = profile.department_id;
            if (profile.role === "admin" || profile.role === "executive" || profile.role === "super_admin") {
                const { data: depts, error: deptsErr } = await supabase
                    .from('departments')
                    .select('id, name')
                    .eq('company_id', profile.company_id)
                    .order('sort_order', { ascending: true });

                if (deptsErr) throw deptsErr;

                const deptList = depts || [];
                setDepartments(deptList);

                // 初期部署：自部署があればそれ、なければリストの最初の部署
                if (!initialDeptId && deptList.length > 0) {
                    initialDeptId = deptList[0].id;
                }
            }

            setSelectedDepartmentId(initialDeptId);

            // 部署IDが確定していない場合（部署未所属かつ会社に部署が1つもない）は初期ロード完了
            if (!initialDeptId) {
                setLoading(false);
            }

        } catch (e: any) {
            setError(e?.message || "初期化に失敗しました");
            toast.error(e?.message || "初期化に失敗しました");
            setLoading(false);
        }
    };

    const fetchDeptData = async (deptId: string) => {
        if (!companyId) return;
        try {
            setDeptLoading(true);

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

            const targetYMs = months.map(m => m.ym);

            // 1. survey_responses 取得
            const { data: responses, error: responseErr } = await supabase
                .from('survey_responses')
                .select('id, recorded_month')
                .eq('company_id', companyId)
                .eq('department_id', deptId)
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

            setDeptScores(scored);

            // 5. 設問一覧の取得（company_id フィルタ必須）
            const { data: questions, error: questionErr } = await supabase
                .from('survey_questions')
                .select('id, text, sort_order')
                .eq('company_id', companyId)
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

            // ── 経営方針インボックス用データ取得 ──
            const { data: focusList, error: focusErr } = await supabase
                .from('executive_monthly_focus')
                .select('id, month, title, content')
                .eq('company_id', companyId)
                .order('month', { ascending: false })
                .limit(7);

            if (focusErr) throw focusErr;

            const curFocus = focusList?.find(f => f.month === currentYM) || null;
            const pstFocus = (focusList || []).filter(f => f.month !== currentYM).slice(0, 6);
            setCurrentFocus(curFocus);
            setPastFocus(pstFocus);

            // 2. 自分のメモ（今月分、本人のみ取得可能）
            if (userId) {
                const { data: noteData, error: noteErr } = await supabase
                    .from('manager_directive_notes')
                    .select('note, focus_id')
                    .eq('manager_user_id', userId)
                    .eq('month', currentYM)
                    .maybeSingle();

                if (noteErr) throw noteErr;
                setNote(noteData?.note || '');
            } else {
                setNote('');
            }

        } catch (e: any) {
            setError(e?.message || "データの取得に失敗しました");
            toast.error(e?.message || "データの取得に失敗しました");
        } finally {
            setDeptLoading(false);
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!userId || !companyId || !departmentId) {
            toast.error("ユーザー情報または部署情報が不足しているため保存できません");
            return;
        }
        try {
            setSavingNote(true);
            const currentYM = deptScores[deptScores.length - 1]?.month;
            if (!currentYM) {
                toast.error("現在の月情報を取得できませんでした");
                return;
            }

            const { error: upsertErr } = await supabase
                .from('manager_directive_notes')
                .upsert({
                    company_id: companyId,
                    department_id: departmentId,
                    manager_user_id: userId,
                    month: currentYM,
                    focus_id: currentFocus?.id ?? null,
                    note: note,
                }, {
                    onConflict: 'manager_user_id,month'
                });

            if (upsertErr) throw upsertErr;
            toast.success("メモを保存しました");
        } catch (e: any) {
            toast.error(e?.message || "メモの保存に失敗しました");
        } finally {
            setSavingNote(false);
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

    // 今月の設問別匿名ガード判定に使用
    const currentMonthScore = deptScores[deptScores.length - 1];

    // 選択中の部署名（フォールバックとしてprofileから取得したdepartmentNameを使用）
    const selectedDeptName = departments.find(d => d.id === selectedDepartmentId)?.name || departmentName;

    return (
        <AppLayout>
            <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
                {/* ヘッダー */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3 mb-2">
                        <Building2 className="w-7 h-7 text-teal" />
                        部署マネジメント
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {userRole === 'manager'
                            ? "自部署の状況を理解し、次の一歩を考えるためのワークスペースです。"
                            : "各部署の状況を理解し、次の一歩を考えるためのワークスペースです。"
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold animate-in fade-in">
                        {error}
                    </div>
                )}

                {/* 部署切替セレクタ（上位ロール限定） */}
                {(userRole === 'admin' || userRole === 'executive' || userRole === 'super_admin') && departments.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal">
                                <Building2 className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 tracking-tight">部署データを表示</h3>
                                <p className="text-[10px] text-slate-400 font-bold">分析対象の部署を切り替えることができます</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-black text-slate-500">部署を選択:</label>
                            <select
                                value={selectedDepartmentId || ''}
                                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                className="text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all cursor-pointer min-w-[160px]"
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {!selectedDepartmentId ? (
                    <EmptyState
                        title={
                            userRole === "manager"
                                ? "部署に所属していません"
                                : "会社にまだ部署が登録されていません"
                        }
                        description={
                            userRole === "manager"
                                ? "部署ダッシュボードは、部署に所属しているマネージャー・管理者に向けた機能です。"
                                : "部署ダッシュボードで分析対象となる部署が登録されていません。管理者設定より部署を登録してください。"
                        }
                        icon={<Building2 className="w-12 h-12 text-slate-200" />}
                    />
                ) : (
                    <div className="space-y-8 animate-in fade-in relative">
                        {deptLoading && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-3xl animate-in fade-in duration-200" style={{ minHeight: '400px' }}>
                                <div className="bg-white border border-slate-100 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3 animate-bounce">
                                    <div className="w-2.5 h-2.5 rounded-full bg-teal animate-ping" />
                                    <span className="text-xs font-black text-slate-700">部署データを読み込み中...</span>
                                </div>
                            </div>
                        )}
                        {/* 📥 経営方針インボックス */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 animate-in fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                        <Inbox className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-800 tracking-tight">
                                            経営方針インボックス
                                        </h2>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {userRole === 'manager'
                                                ? "自部署での実行プランに落とし込むためのワークスペース"
                                                : "今月の経営方針と各部署への落とし込みを確認できます"
                                            }
                                        </p>
                                    </div>
                                </div>
                                {userRole === 'manager' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 shrink-0 self-start sm:self-auto">
                                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                                        メモは本人のみ閲覧可
                                    </div>
                                )}
                            </div>

                            {/* 経営方針（原文・過去履歴）: 全ロールに表示 */}
                            <div className={userRole === 'manager' ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "space-y-6"}>
                                {/* 左カラム / 上部：経営方針（原文表示） */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Bookmark className="w-3.5 h-3.5 text-amber-500" /> 今月の経営方針
                                        </h3>
                                        {currentFocus ? (
                                            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-amber-100 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                                                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
                                                <h4 className="text-sm font-black text-amber-900 leading-tight">
                                                    {currentFocus.title}
                                                </h4>
                                                <p className="text-xs text-amber-800/90 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {currentFocus.content}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                                                <p className="text-xs text-slate-400 font-bold">
                                                    経営層からの今月の課題はまだ登録されていません。
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 過去の方針（アコーディオン） */}
                                    {pastFocus.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">過去の方針</h3>
                                            <div className="space-y-2">
                                                {pastFocus.map(pf => (
                                                    <details key={pf.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{pf.month}</span>
                                                                <span className="text-xs font-black text-slate-700 truncate max-w-[200px] sm:max-w-xs">{pf.title}</span>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                                                        </summary>
                                                        <div className="px-4 pb-4 pt-1 border-t border-slate-50 text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap bg-slate-50/50">
                                                            {pf.content}
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 右カラム：マネージャーの落とし込みメモ（manager のみ表示） */}
                                {userRole === 'manager' && (
                                    <div className="flex flex-col justify-between space-y-6">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                自部署への落とし込みメモ
                                            </h3>
                                            <div className="relative">
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    maxLength={2000}
                                                    placeholder="この方針を自部署でどう実行するか、メンバーにどう伝えるか、自由に書き留めてください"
                                                    rows={6}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none leading-relaxed"
                                                />
                                                <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold">
                                                    {note.length} / 2000
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-[10px] text-slate-400 font-bold leading-normal">
                                                    ※ このメモはあなた本人のみが閲覧できます（メンバー・他マネージャー・経営層には非公開です）
                                                </p>
                                                <button
                                                    onClick={handleSaveNote}
                                                    disabled={savingNote}
                                                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                                                >
                                                    {savingNote ? "保存中..." : "メモを保存"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 思考のヒント（固定文言） */}
                                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                                            <p className="text-xs font-black text-amber-700 mb-2 flex items-center gap-1.5">
                                                💭 考えるヒント
                                            </p>
                                            <ul className="text-xs text-amber-900/90 space-y-1.5 font-bold leading-relaxed">
                                                <li>・この方針は、自部署のどの業務に直結しますか？</li>
                                                <li>・チームの誰の声を聞くと、ヒントが得られそうですか？</li>
                                                <li>・先月のスコアの動きと関連はありますか？</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                

                        {/* 📊 今月の設問別スコア */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-4 h-4" /> 今月の設問別スコア
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">今月、どの問いに課題が出ているかを確認しましょう</p>
                            </div>

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
