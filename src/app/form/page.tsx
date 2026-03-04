"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";

// 型定義
interface Question {
    id: string;
    text: string;
    hint: string | null;
    sort_order: number;
}

interface Department {
    id: string;
    name: string;
}

interface Axis {
    id: string;
    name: string;
}

function SurveyFormContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [axes, setAxes] = useState<Axis[]>([]);
    const [secondaryAxisName, setSecondaryAxisName] = useState("第2軸");
    const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

    const [department, setDepartment] = useState("");
    const [axisId, setAxisId] = useState("");
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [kpiImprovement, setKpiImprovement] = useState("");
    const [freeComment, setFreeComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 回答状況のチェックとデータ取得
    useEffect(() => {
        const checkAndFetch = async () => {
            setLoading(true);
            setError(null);

            let effectiveCompanyId = companyId;

            try {
                const now = new Date();
                const currentMonthPart = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

                // 1. URLパラメータにない場合、ログインユーザーから取得を試みる
                if (!effectiveCompanyId) {
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (authUser) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('company_id')
                            .eq('id', authUser.id)
                            .single();
                        if (userData?.company_id) {
                            effectiveCompanyId = userData.company_id;
                        }
                    }
                }

                // 2. それでもない場合（デモ用フォールバック）、DB内の最初の企業を取得
                if (!effectiveCompanyId) {
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('id')
                        .limit(1);
                    if (companies && companies.length > 0) {
                        effectiveCompanyId = companies[0].id;
                    }
                }

                if (!effectiveCompanyId) {
                    setError("対象の企業を特定できませんでした。正しいリンクからアクセスしてください。");
                    setLoading(false);
                    return;
                }

                // 1. 重複回答チェック (LocalStorage)
                const storageKey = `signs_ai_answered_${effectiveCompanyId}_${currentMonthPart}`;
                if (localStorage.getItem(storageKey) === "true") {
                    setHasAnswered(true);
                }

                // 2. 設問取得
                const { data: qData, error: qErr } = await supabase
                    .from('survey_questions')
                    .select('id, text, hint, sort_order')
                    .order('sort_order', { ascending: true });

                if (qErr) throw qErr;
                setQuestions(qData || []);

                // 3. 部署取得
                const { data: dData, error: dErr } = await supabase
                    .from('departments')
                    .select('id, name')
                    .eq('company_id', effectiveCompanyId);

                if (dErr) throw dErr;
                setDepartments(dData || []);
                setResolvedCompanyId(effectiveCompanyId);

                // 4. 第2軸情報取得
                const { data: cData } = await supabase.from('companies').select('kpi_secondary_axis_name').eq('id', effectiveCompanyId).single();
                if (cData) setSecondaryAxisName(cData.kpi_secondary_axis_name);

                const { data: aData } = await supabase.from('kpi_axes').select('id, name').eq('company_id', effectiveCompanyId).order('sort_order', { ascending: true });
                setAxes(aData || []);

                if (!dData || dData.length === 0) {
                    setError("該当する企業の部署情報が見つかりません。");
                }
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError("データの取得に失敗しました。時間をおいて再度お試しください。");
            } finally {
                setLoading(false);
            }
        };

        checkAndFetch();
    }, [companyId, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!department) return alert("所属部署を選択してください。");
        if (Object.keys(answers).length < questions.length) {
            // スクロールで未回答の設問に誘導
            const firstUnanswered = questions.find(q => !answers[q.id]);
            if (firstUnanswered) {
                const el = document.getElementById(`question-${firstUnanswered.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return alert("すべての5段階評価に回答してください。");
        }
        if (kpiImprovement.length < 100) {
            return alert("Step 3の記述は100文字以上で入力してください。");
        }

        setIsSubmitting(true);

        try {
            // 1. response 保存
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

            const { data: response, error: rErr } = await supabase
                .from('survey_responses')
                .insert({
                    company_id: resolvedCompanyId,
                    department_id: department,
                    axis_id: axisId || null,
                    recorded_month: currentMonth,
                    free_comment: freeComment,
                    cross_dept_feedback: kpiImprovement // KPI改善案をこちらに格納
                })
                .select()
                .single();

            if (rErr) throw rErr;

            // 2. answers 保存
            const answerData = Object.entries(answers).map(([qId, score]) => ({
                response_id: response.id,
                question_id: qId,
                score: score
            }));

            const { error: aErr } = await supabase
                .from('survey_answers')
                .insert(answerData);

            if (aErr) throw aErr;

            // 3. 成功処理
            if (resolvedCompanyId) {
                localStorage.setItem(`signs_ai_answered_${resolvedCompanyId}_2026_02`, "true");
            }
            setHasAnswered(true);
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error("Submit error details:", err);
            const msg = err.message || "不明なエラー";
            alert(`送信に失敗しました。\n理由: ${msg}\n\nネットワーク状況を確認し、改善しない場合は管理者にお問い合わせください。`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetDemo = () => {
        if (resolvedCompanyId) {
            const now = new Date();
            const currentMonthPart = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
            localStorage.removeItem(`signs_ai_answered_${resolvedCompanyId}_${currentMonthPart}`);
        }
        setHasAnswered(false);
        setAnswers({});
        setKpiImprovement("");
        setFreeComment("");
        setDepartment("");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">エラーが発生しました</h1>
                <p className="text-sm text-slate-500 mb-6">{error}</p>
                <Link href="/" className="text-teal font-bold underline">ダッシュボードへ</Link>
            </div>
        );
    }

    const progress = questions.length > 0 ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">
            <main className="max-w-xl mx-auto px-4 pt-16">
                <div className="text-center mb-10 mt-6 relative z-10">
                    <div className="inline-flex flex-col items-center">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Signs AI</h1>
                        <Badge className="bg-teal/10 text-teal border-none text-[10px] font-bold py-1 px-3">
                            {new Date().getFullYear()}年{new Date().getMonth() + 1}月度 ボイスチェック
                        </Badge>
                    </div>
                </div>

                {hasAnswered ? (
                    <div className="bg-white p-10 sm:p-14 rounded-[40px] shadow-sm border border-slate-100 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="w-20 h-20 bg-teal/10 text-teal rounded-full flex items-center justify-center text-4xl mx-auto">☕️</div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tighter">お疲れ様です。<br />あなたの声、確かに受け取りました。</h2>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            いただいた回答は、誰が書いたか分からない形で集計され、<br className="hidden sm:block" />
                            組織のより良い環境づくりや、組織方針の改善に活用されます。<br />
                            ひと息ついて、今日も良い1日を！
                        </p>
                        <div className="pt-8 border-t border-slate-100/60 mt-8 relative z-10">
                            <button onClick={resetDemo} className="text-xs text-slate-400 hover:text-slate-600 underline font-bold">リセット（再入力）</button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <p className="text-[13px] text-slate-500 leading-relaxed font-medium mb-10 text-center relative z-10">
                            このアンケートは、あなたが日々感じている「体温（熱量や違和感）」を<br className="hidden sm:block" />
                            正しく組織の血液にのせるためのものです。<br />
                            <span className="font-bold text-slate-700">特定の個人が特定されることはありません。</span>
                            直感でお答えください。
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Step 1: 所属属性 */}
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 mb-6 flex items-center gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">1</span>
                                        あなたの所属部署を教えてください
                                    </label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20"
                                        required
                                    >
                                        <option value="">タップして選択...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {axes.length > 0 && (
                                    <div className="pt-6 border-t border-slate-100/60">
                                        <label className="text-[13px] font-bold text-slate-600 mb-6 flex items-center gap-3">
                                            あなたの所属する{secondaryAxisName}を教えてください
                                        </label>
                                        <select
                                            value={axisId}
                                            onChange={(e) => setAxisId(e.target.value)}
                                            className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20"
                                            required
                                        >
                                            <option value="">タップして選択...</option>
                                            {axes.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: 選択式 */}
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/95 backdrop-blur-md py-4 z-40">
                                    <label className="text-[13px] font-bold text-slate-600 flex items-center gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">2</span>
                                        最近1ヶ月の状況について
                                    </label>
                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                                        全くない(1) → 強く想う(5)
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {questions.map((q, index) => (
                                        <div key={q.id} id={`question-${q.id}`} className="group">
                                            <div className="mb-5">
                                                <p className="text-[14px] font-bold text-slate-700 leading-relaxed mb-1.5">
                                                    <span className="text-slate-300 mr-2 font-medium">Q{index + 1}.</span>
                                                    {q.text}
                                                </p>
                                                {q.hint && <p className="text-[11px] text-slate-400 font-medium ml-7">{q.hint}</p>}
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                {[1, 2, 3, 4, 5].map((score) => {
                                                    const isSelected = answers[q.id] === score;
                                                    return (
                                                        <button
                                                            key={score}
                                                            type="button"
                                                            onClick={() => setAnswers({ ...answers, [q.id]: score })}
                                                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-black transition-all ${isSelected
                                                                ? "bg-teal text-white shadow-lg scale-110"
                                                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                                }`}
                                                        >
                                                            {score}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3 & 4: 自由記述 */}
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 mb-3 flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span>KPI達成・成長のために、改善すると良さそうな点はありますか？</span>
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded shrink-0">100字以上</span>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="relative mt-2">
                                        <textarea
                                            value={kpiImprovement}
                                            onChange={(e) => setKpiImprovement(e.target.value)}
                                            required
                                            minLength={100}
                                            className="w-full bg-slate-50 border-transparent rounded-2xl p-4 pb-8 text-[13px] text-slate-600 outline-none focus:ring-2 focus:ring-teal/20 min-h-[140px]"
                                            placeholder="例：マーケ部が集めてくれるリードの質が上がり、商談はしやすくなっています。ただ、開発部への依頼フローが..."
                                        />
                                        <div className={`absolute bottom-4 right-4 text-[10px] font-bold ${kpiImprovement.length >= 100 ? "text-teal" : "text-red-400"}`}>
                                            {kpiImprovement.length} / 100文字以上
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <label className="text-[13px] font-bold text-slate-600 mb-3 flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">4</span>
                                        <div>
                                            <span>その他、組織や経営陣に伝えておきたい「本音」</span>
                                            <span className="block text-[11px] font-medium text-slate-400 mt-1">※任意</span>
                                        </div>
                                    </label>
                                    <textarea
                                        value={freeComment}
                                        onChange={(e) => setFreeComment(e.target.value)}
                                        className="w-full mt-2 bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] text-slate-600 outline-none focus:ring-2 focus:ring-teal/20 min-h-[100px]"
                                        placeholder="例：最近、会議のための会議が増えている気がします。もっとお客様と向き合う時間が欲しいです。"
                                    />
                                </div>
                            </div>

                            <div className="text-center pt-8 pb-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || Object.keys(answers).length < questions.length || !department || (axes.length > 0 && !axisId) || kpiImprovement.length < 100}
                                    className={`px-14 py-4 rounded-full font-black text-[13px] transition-all ${isSubmitting || Object.keys(answers).length < questions.length || !department || (axes.length > 0 && !axisId) || kpiImprovement.length < 100
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-teal text-white shadow-lg hover:scale-105"
                                        }`}
                                >
                                    {isSubmitting ? "送信中..." : "アンケートを送信する"}
                                </button>
                                <div className="mt-4 text-[11px] font-bold text-slate-400">進捗: {progress}%</div>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SurveyFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
            </div>
        }>
            <SurveyFormContent />
        </Suspense>
    );
}
