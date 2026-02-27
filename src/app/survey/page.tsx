"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { TabBar } from "@/components/ui/TabBar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

const questions = [
    { id: 1, text: "今の仕事にワクワクしていますか？", hint: "月曜の朝、布団の中で思い浮かべてみてください。" },
    { id: 2, text: "何かが決まるのを「待つ時間」は少なかったですか？", hint: "待っている間、あなたの熱量は少しずつ冷めていきます。" },
    { id: 3, text: "必要な情報が自分まで届いていましたか？", hint: "知らなかったことで、損をしていませんでしたか。" },
    { id: 4, text: "「調整」や「根回し」に時間を取られすぎていませんか？", hint: "本来、何に使いたかった時間ですか。" },
    { id: 5, text: "言いづらいことを飲み込まずに伝えられましたか？", hint: "飲み込んだ言葉は、どこかで体温を下げます。" },
    { id: 6, text: "「何を成すべきか」に迷わず集中できましたか？", hint: "迷いは、あなたのせいではないかもしれません。" },
    { id: 7, text: "上司や仲間から反応（賞賛や指摘）がありましたか？", hint: "無反応は、じわじわと人を蝕みます。" },
    { id: 8, text: "業務量は、質を維持できる範囲でしたか？", hint: "「頑張ればできる」は、長くは続きません。" },
    { id: 9, text: "「顧客のプラスになること」に時間を使えましたか？", hint: "社内都合に時間を奪われた日、悔しくなかったですか。" },
    { id: 10, text: "新しい工夫や挑戦ができましたか？", hint: "同じことの繰り返しは、安全に見えて危険です。" },
    { id: 11, text: "KPI達成に向けて、準備周到に活動できていますか？", hint: "道筋が見えているだけで、体温は上がります。" },
];

const surveyData: Record<string, { scores: number[]; aiComment: string; pulse: number; pulseHistory: number[] }> = {
    all: {
        scores: [4.2, 2.1, 3.8, 1.8, 3.5, 3.2, 4.0, 2.4, 4.1, 3.7, 3.9],
        pulse: 3.2,
        pulseHistory: [3.5, 3.4, 3.3, 3.2, 3.1, 3.2],
        aiComment: "組織全体として「ワクワク感」と「顧客貢献感」は高い水準にありますが、「意思決定の待ち時間（Q2）」と「根回しコスト（Q4）」が明確なボトルネックとなっています。特にQ2の2.1は危険水域であり、スピード感の欠如が後続のQ8（業務量）への圧迫に繋がっている構造が見えます。仕組みによる解決が急務です。"
    },
    sales: {
        scores: [4.5, 1.8, 4.0, 1.2, 2.5, 3.0, 4.2, 1.9, 4.6, 3.5, 3.8],
        pulse: 2.1,
        pulseHistory: [3.1, 2.9, 2.8, 2.5, 2.3, 2.1],
        aiComment: "営業部は「顧客の役に立ちたい」という熱量が非常に高い（Q9: 4.6）一方で、社内調整（Q4: 1.2）と決定待ち（Q2: 1.8）でエネルギーが削がれています。言いたいことを飲み込む傾向（Q5: 2.5）もあり、数字を作るための『無理』が個人の体温低下として顕在化しつつあります。"
    },
    mktg: {
        scores: [4.3, 3.5, 4.2, 3.8, 4.0, 4.1, 3.9, 3.8, 4.4, 4.0, 4.2],
        pulse: 4.2,
        pulseHistory: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2],
        aiComment: "マーケ部は全指標において安定した高スコアを維持しており、現在の「質の高いリード獲得」という方針が個人の納得感と直結しています。調整コストも低く、理想的な自律駆動型チームとなっています。他部署へのナレッジ展開のハブとなることを推奨します。"
    },
    dev: {
        scores: [3.8, 2.5, 3.2, 3.0, 3.1, 2.8, 3.5, 2.0, 3.6, 4.2, 3.5],
        pulse: 2.4,
        pulseHistory: [3.4, 3.2, 3.0, 2.8, 2.5, 2.4],
        aiComment: "開発部は「新しい技術への挑戦（Q10: 4.2）」にやりがいを感じていますが、恒常的な業務過多（Q8: 2.0）が深刻です。仕様決定の不透明さが『迷い』を生み、集中を削いでいます。クリエイティブな時間を確保するための優先順位の整理が不可欠です。"
    },
    cs: {
        scores: [3.5, 2.2, 3.0, 2.4, 2.2, 3.0, 3.1, 2.5, 4.0, 3.2, 3.0],
        pulse: 3.1,
        pulseHistory: [3.6, 3.5, 3.4, 3.2, 3.1, 3.1],
        aiComment: "CS部は顧客への貢献意欲は高いものの、他部署（特に開発）からの情報伝達や仕様変更の反映待ち（Q2）により、自信を持って顧客対応ができないジレンマ（Q5: 2.2）を抱えています。現場の声を製品に反映させるパイプの詰まりを解消する必要があります。"
    },
    hr: {
        scores: [4.0, 4.0, 4.5, 4.2, 4.4, 4.1, 4.3, 4.0, 3.8, 4.1, 4.0],
        pulse: 4.0,
        pulseHistory: [3.9, 3.9, 3.8, 3.9, 4.0, 4.0],
        aiComment: "人事部は情報の透明性が高く、非常にオープンな文化が形成されています。ただし、全社的な「調整コスト」が高まっている現状を認識し、制度設計を通じた組織のデトックスを主導すべき時期に来ています。"
    }
};

export default function SurveyDashboard() {
    const [view, setView] = useState("all");

    const currentData = surveyData[view];

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Header />

            <main className="max-w-3xl mx-auto px-5 py-8 space-y-10">

                {/* Navigation Back */}
                <div className="flex items-center justify-between">
                    <Link href="/" className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-teal transition-colors">
                        <span className="text-sm">←</span> DASHBOARD
                    </Link>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-500 border-none font-black text-[10px]">SURVEY ANALYSIS</Badge>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">組織の体温</h1>
                            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-[0.1em]">11の問いから紐解く現場の真実</p>
                        </div>
                    </div>
                    <TabBar
                        tabs={[
                            { id: "all", label: "🏢 全社" },
                            { id: "sales", label: "💼 営業部" },
                            { id: "mktg", label: "📢 マーケ部" },
                            { id: "dev", label: "💻 開発部" },
                            { id: "cs", label: "🎧 CS部" },
                            { id: "hr", label: "🤝 人事部" },
                        ]}
                        active={view}
                        onChange={setView}
                    />
                </div>

                {/* Pulse History Chart */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">🌡️</span>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">組織体温の推移（直近6ヶ月）</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pl-8">
                                継続的なストレスや熱量の変化をモニタリング
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">当月平均</span>
                            <span className={cn(
                                "text-4xl font-black tabular-nums tracking-tighter",
                                currentData.pulse >= 3.5 ? "text-emerald-500" : currentData.pulse >= 2.5 ? "text-amber-500" : "text-rose-500"
                            )}>
                                {currentData.pulse.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <div className="h-40 w-full pt-4">
                        <DetailLineChart
                            data={currentData.pulseHistory}
                            labels={["9月", "10月", "11月", "12月", "1月", "2月"]}
                            color={currentData.pulse >= 3.5 ? "#10B981" : currentData.pulse >= 2.5 ? "#F59E0B" : "#EF4444"}
                            height={140}
                        />
                    </div>
                </div>

                {/* AI Analysis Card */}
                <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-xl shadow-inner shadow-teal/5">🧠</div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">AI組織分析レポート</h3>
                                <p className="text-[10px] text-teal font-black uppercase tracking-widest">{view === "all" ? "Whole Company" : `${view.toUpperCase()} DEPARTMENT`}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {currentData.aiComment}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-tighter uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                            Confidence: High (Data sufficiency: 94%)
                        </div>
                    </div>
                </div>

                {/* Question Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">設問別スコア詳細</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Good</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Warning</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Critical</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map((q, i) => {
                            const prevScore = currentData.scores[i] * 0.95; // Math.randomを排除して固定の係数（モック）に
                            return (
                                <SurveyQuestionCard
                                    key={q.id}
                                    question={q.text}
                                    hint={q.hint}
                                    score={currentData.scores[i]}
                                    prevScore={prevScore}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Footer info */}
                <div className="pt-10 text-center space-y-4">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        Signs AI | Monthly Organizational Temperature Check
                    </p>
                </div>
            </main>
        </div>
    );
}
