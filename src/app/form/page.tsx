"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

// 要件定義書に沿った11の設問と一言コメント
const questions = [
    { id: 1, text: "今の仕事にワクワクしていますか？", hint: "月曜の朝、布団の中で思い浮かべてみてください。" },
    { id: 2, text: "今月、何かが決まるのを「待っている時間」は少なかったですか？", hint: "待っている間、あなたの熱量は少しずつ冷めていきます。" },
    { id: 3, text: "必要な情報が自分まで届いていましたか？", hint: "知らなかったことで、損をしていませんでしたか。" },
    { id: 4, text: "社内の「調整」や「根回し」に時間を取られすぎていませんか？", hint: "本来、何に使いたかった時間ですか。" },
    { id: 5, text: "言いづらい懸念や反対意見を飲み込まずに伝えられましたか？", hint: "飲み込んだ言葉は、どこかで体温を下げます。" },
    { id: 6, text: "自分が「何を成すべきか」に迷わず集中できましたか？", hint: "迷いは、あなたのせいではないかもしれません。" },
    { id: 7, text: "上司や仲間から何らかの反応（賞賛や指摘）がありましたか？", hint: "無反応は、じわじわと人を蝕みます。" },
    { id: 8, text: "今の業務量は、質を維持したままやり遂げられる範囲でしたか？", hint: "「頑張ればできる」は、長くは続きません。" },
    { id: 9, text: "「顧客のプラスになること」に時間を使えましたか？", hint: "社内都合に時間を奪われた日、悔しくなかったですか。" },
    { id: 10, text: "新しい工夫や少し背伸びした挑戦ができましたか？", hint: "同じことの繰り返しは、安全に見えて危険です。" },
    { id: 11, text: "KPI達成に向けて、準備周到に活動できていますか？", hint: "道筋が見えているだけで、体温は上がります。" },
];

const departments = [
    { id: "sales", name: "営業部", headCount: 12, answered: 10 },
    { id: "mktg", name: "マーケ部", headCount: 8, answered: 7 },
    { id: "dev", name: "開発部", headCount: 15, answered: 11 },
    { id: "cs", name: "CS部", headCount: 6, answered: 5 },
    { id: "hr", name: "人事部", headCount: 4, answered: 4 },
];

const products = [
    { id: "all", name: "全般 / プロダクト特定なし" },
    { id: "prod_a", name: "プロダクトA" },
    { id: "prod_b", name: "プロダクトB" },
    { id: "prod_c", name: "プロダクトC" }
];

export default function SurveyFormPage() {
    const [hasAnswered, setHasAnswered] = useState(false);
    const [department, setDepartment] = useState("");
    const [productId, setProductId] = useState("");
    const [answers, setAnswers] = useState<Record<number, number>>({});

    const [kpiImprovement, setKpiImprovement] = useState("");
    const [freeComment, setFreeComment] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // デモ用: LocalStorageで回答状況を保持
    useEffect(() => {
        const answered = localStorage.getItem("signs_ai_answered_2026_02");
        if (answered === "true") {
            setHasAnswered(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!department) return alert("所属部署を選択してください。");
        if (!productId) return alert("担当プロダクト（または全般）を選択してください。");
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

        // 送信シミュレーション
        setTimeout(() => {
            localStorage.setItem("signs_ai_answered_2026_02", "true");
            setHasAnswered(true);
            setIsSubmitting(false);
            window.scrollTo(0, 0);
        }, 1200);
    };

    const resetDemo = () => {
        localStorage.removeItem("signs_ai_answered_2026_02");
        setHasAnswered(false);
        setAnswers({});
        setKpiImprovement("");
        setFreeComment("");
        setDepartment("");
        setProductId("");
    };

    const selectedDept = departments.find(d => d.id === department);
    const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">
            {/* Header / Admin Link */}
            <div className="bg-slate-800 text-white text-[10px] p-2 text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 fixed top-0 w-full z-50">
                <span>デモ用: URLの共有イメージ（通常は管理者から各部署にこの画面のURLが配布されます）</span>
                <Link href="/" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white font-bold">
                    ダッシュボードに戻る
                </Link>
            </div>

            {/* Main content with top padding for fixed header */}
            <main className="max-w-xl mx-auto px-4 pt-24">

                {/* Header Concept Area */}
                <div className="text-center mb-10 mt-6 relative z-10">
                    <div className="inline-flex flex-col items-center">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Signs AI</h1>
                        <Badge className="bg-teal/10 text-teal border-none text-[10px] font-bold py-1 px-3">2026年2月度 ボイスチェック</Badge>
                    </div>
                </div>

                {hasAnswered ? (
                    <div className="bg-white p-10 sm:p-14 rounded-[40px] shadow-sm border border-slate-100 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="w-20 h-20 bg-teal/10 text-teal rounded-full flex items-center justify-center text-4xl mx-auto align-middle">
                            ☕️
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tighter">お疲れ様です。<br />あなたの声、確かに受け取りました。</h2>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            いただいた回答は、誰が書いたか分からない形で集計され、<br className="hidden sm:block" />
                            組織のより良い環境づくりや、経営方針の改善に活用されます。<br />
                            <br />
                            ひと息ついて、今日も良い1日を！
                        </p>

                        <div className="pt-8 border-t border-slate-100/60 mt-8 relative z-10">
                            <button
                                onClick={resetDemo}
                                className="text-xs text-slate-400 hover:text-slate-600 underline font-bold"
                            >
                                デモ用：回答状況をリセットしてもう一度入力する
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* 背景の柔らかなグラデーション */}
                        <div className="absolute top-10 inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none -mx-10 rounded-[40px]" />

                        {/* イントロダクションテキスト */}
                        <p className="text-[13px] text-slate-500 leading-relaxed font-medium mb-10 text-center relative z-10">
                            このアンケートは、あなたが日々感じている「体温（熱量や違和感）」を<br className="hidden sm:block" />
                            正しく組織の血液にのせるためのものです。<br />
                            <span className="font-bold text-slate-700">特定の個人が特定されることはありません。</span>
                            リラックスして、直感でお答えください。
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                            {/* Step 1: 所属部署と担当プロダクト */}
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 transition-all hover:border-slate-200">
                                <label className="text-[13px] font-bold text-slate-600 mb-6 flex items-center gap-3">
                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">1</span>
                                    あなたの基本情報（部署・担当領域）を教えてください
                                </label>

                                <div className="space-y-6">
                                    {/* 所属部署 */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold text-slate-500 ml-1">所属部署</div>
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">タップして選択...</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>

                                        {selectedDept && (
                                            <div className="px-1 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                                <span className="text-[10px] text-slate-400 font-bold">現在のチーム回答率（リアルタイム）</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-teal transition-all duration-1000 ease-out"
                                                            style={{ width: `${(selectedDept.answered / selectedDept.headCount) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black tabular-nums text-slate-400">
                                                        {selectedDept.answered}/{selectedDept.headCount}名
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 担当プロダクト */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold text-slate-500 ml-1">担当プロダクト（第2軸）</div>
                                        <select
                                            value={productId}
                                            onChange={(e) => setProductId(e.target.value)}
                                            className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">タップして選択...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: 選択式（11問） */}
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60">
                                <div className="flex items-center justify-between mb-8 sticky top-[80px] sm:top-[70px] bg-white/95 backdrop-blur-md py-4 z-40 border-b border-slate-50">
                                    <label className="text-[13px] font-bold text-slate-600 flex items-center gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">2</span>
                                        最近1ヶ月の状況について
                                    </label>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                                        <span>全くない(1)</span>
                                        <div className="w-4 h-px bg-slate-200" />
                                        <span>強く想う(5)</span>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {questions.map((q, index) => (
                                        <div
                                            key={q.id}
                                            id={`question-${q.id}`}
                                            className="group"
                                        >
                                            <div className="mb-5">
                                                <p className="text-[14px] font-bold text-slate-700 leading-relaxed mb-1.5">
                                                    <span className="text-slate-300 mr-2 font-medium">Q{index + 1}.</span>
                                                    {q.text}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-medium ml-7">
                                                    {q.hint}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center sm:px-4">
                                                {[1, 2, 3, 4, 5].map((score) => {
                                                    const isSelected = answers[q.id] === score;
                                                    return (
                                                        <button
                                                            key={score}
                                                            type="button"
                                                            onClick={() => setAnswers({ ...answers, [q.id]: score })}
                                                            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-200 outline-none
                                                                ${isSelected
                                                                    ? "bg-teal text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] scale-110"
                                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 space-y-8">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 mb-3 flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="leading-relaxed">来月のKPIを達成・またはさらに伸ばすために、自部門や他部門でどんな点を意識（改善）すると良さそうだと感じますか？</span>
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded shrink-0">必須</span>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="relative mt-2">
                                        <textarea
                                            value={kpiImprovement}
                                            onChange={(e) => setKpiImprovement(e.target.value)}
                                            required
                                            minLength={100}
                                            className={`w-full bg-slate-50 border rounded-2xl p-4 pb-8 text-[13px] text-slate-600 outline-none focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all min-h-[140px] resize-y ${kpiImprovement.length > 0 && kpiImprovement.length < 100 ? "border-red-200 bg-red-50/30" : "border-transparent"
                                                }`}
                                            placeholder="例：マーケ部が集めてくれるリードの質が上がり、商談はしやすくなっています。ただ、開発部へのバグ報告のフローが複雑で時間がかかっているので、そこを効率化できればさらに数字が伸びると思います。"
                                        />
                                        <div className={`absolute bottom-4 right-4 text-[10px] font-bold transition-colors ${kpiImprovement.length >= 100 ? "text-teal" : (kpiImprovement.length > 0 ? "text-red-400" : "text-slate-400")
                                            }`}>
                                            {kpiImprovement.length} / 100文字以上
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100/60">
                                    <label className="text-[13px] font-bold text-slate-600 mb-3 flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0">4</span>
                                        <div>
                                            <span>その他、組織や経営陣に伝えておきたい「本音」はありますか？</span>
                                            <span className="block text-[11px] font-medium text-slate-400 mt-1">※任意。AIが文脈を要約してレポートに反映します</span>
                                        </div>
                                    </label>
                                    <textarea
                                        value={freeComment}
                                        onChange={(e) => setFreeComment(e.target.value)}
                                        className="w-full mt-2 bg-slate-50 border-transparent rounded-2xl p-4 text-[13px] text-slate-600 outline-none focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all min-h-[100px] resize-y"
                                        placeholder="例：最近、会議のための会議が増えている気がします。もっとお客様と向き合う時間が欲しいです。"
                                    />
                                </div>
                            </div>

                            {/* Submit Area */}
                            <div className="text-center pt-8 pb-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || Object.keys(answers).length < questions.length || !department || kpiImprovement.length < 100}
                                    className={`relative px-14 py-4 rounded-full font-black text-[13px] transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,118,255,0.1)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] hover:scale-[1.02] ${isSubmitting || Object.keys(answers).length < questions.length || !department || kpiImprovement.length < 100
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none hover:shadow-none hover:scale-100"
                                        : "bg-teal text-white"
                                        }`}
                                >
                                    {isSubmitting ? "送信しています..." : "アンケートを送信する"}
                                </button>

                                <div className="mt-6 space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400">
                                        現在の回答進捗: {progress}%
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400/80">
                                        一度送信すると、今月は再回答できません
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
