"use client";

import Link from "next/link";
import { useState } from "react";
import { 
    ArrowRight, 
    BarChart3, 
    Sparkles, 
    Clock, 
    Target,
    Users,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Maximize2,
    Compass
} from "lucide-react";
import { ScatterPlot } from "@/components/dashboard/ScatterPlot";

const dummyHistoricalData: Record<string, any[]> = {
    "default": [
        { id: "d1", name: "営業部", head: 25, productivity: 140, pulse: 2.1, weather: "rain", kpiAch: 110, kpiName: "売上高", respondentsCount: 20, masterHeadcount: 25 },
        { id: "d2", name: "開発部", head: 45, productivity: 40, pulse: 2.9, weather: "cloud", kpiAch: 80, kpiName: "リリース件数", respondentsCount: 40, masterHeadcount: 45 },
        { id: "d3", name: "マーケ部", head: 8, productivity: 180, pulse: 4.2, weather: "sun", kpiAch: 150, kpiName: "リード数", respondentsCount: 8, masterHeadcount: 8 },
        { id: "d4", name: "人事部", head: 5, productivity: 110, pulse: 4.0, weather: "sun", kpiAch: 100, kpiName: "採用数", respondentsCount: 5, masterHeadcount: 5 },
        { id: "d5", name: "CS部", head: 30, productivity: 60, pulse: 2.8, weather: "cloud", kpiAch: 90, kpiName: "解約抑制率", respondentsCount: 28, masterHeadcount: 30 },
    ],
    "1m": [
        { id: "d1", name: "営業部", head: 25, productivity: 155, pulse: 2.8, weather: "cloud", kpiAch: 120, kpiName: "売上高", respondentsCount: 22, masterHeadcount: 25 },
        { id: "d2", name: "開発部", head: 40, productivity: 60, pulse: 3.1, weather: "cloud", kpiAch: 90, kpiName: "リリース件数", respondentsCount: 38, masterHeadcount: 40 },
        { id: "d3", name: "マーケ部", head: 8, productivity: 170, pulse: 4.1, weather: "sun", kpiAch: 140, kpiName: "リード数", respondentsCount: 8, masterHeadcount: 8 },
        { id: "d4", name: "人事部", head: 5, productivity: 110, pulse: 4.0, weather: "sun", kpiAch: 100, kpiName: "採用数", respondentsCount: 5, masterHeadcount: 5 },
        { id: "d5", name: "CS部", head: 28, productivity: 65, pulse: 3.0, weather: "cloud", kpiAch: 95, kpiName: "解約抑制率", respondentsCount: 25, masterHeadcount: 28 },
    ],
    "3m": [
        { id: "d1", name: "営業部", head: 22, productivity: 160, pulse: 3.5, weather: "sun", kpiAch: 125, kpiName: "売上高", respondentsCount: 20, masterHeadcount: 22 },
        { id: "d2", name: "開発部", head: 35, productivity: 80, pulse: 3.4, weather: "cloud", kpiAch: 95, kpiName: "リリース件数", respondentsCount: 33, masterHeadcount: 35 },
        { id: "d3", name: "マーケ部", head: 7, productivity: 150, pulse: 3.8, weather: "sun", kpiAch: 130, kpiName: "リード数", respondentsCount: 7, masterHeadcount: 7 },
        { id: "d4", name: "人事部", head: 4, productivity: 100, pulse: 3.9, weather: "sun", kpiAch: 100, kpiName: "採用数", respondentsCount: 4, masterHeadcount: 4 },
        { id: "d5", name: "CS部", head: 25, productivity: 75, pulse: 3.2, weather: "cloud", kpiAch: 100, kpiName: "解約抑制率", respondentsCount: 22, masterHeadcount: 25 },
    ],
    "6m": [
        { id: "d1", name: "営業部", head: 20, productivity: 170, pulse: 3.9, weather: "sun", kpiAch: 130, kpiName: "売上高", respondentsCount: 18, masterHeadcount: 20 },
        { id: "d2", name: "開発部", head: 30, productivity: 100, pulse: 3.7, weather: "sun", kpiAch: 105, kpiName: "リリース件数", respondentsCount: 28, masterHeadcount: 30 },
        { id: "d3", name: "マーケ部", head: 6, productivity: 140, pulse: 3.7, weather: "sun", kpiAch: 120, kpiName: "リード数", respondentsCount: 6, masterHeadcount: 6 },
        { id: "d4", name: "人事部", head: 4, productivity: 95, pulse: 3.8, weather: "sun", kpiAch: 100, kpiName: "採用数", respondentsCount: 4, masterHeadcount: 4 },
        { id: "d5", name: "CS部", head: 22, productivity: 85, pulse: 3.5, weather: "cloud", kpiAch: 105, kpiName: "解約抑制率", respondentsCount: 20, masterHeadcount: 22 },
    ],
    "12m": [
        { id: "d1", name: "営業部", head: 15, productivity: 140, pulse: 4.2, weather: "sun", kpiAch: 110, kpiName: "売上高", respondentsCount: 15, masterHeadcount: 15 },
        { id: "d2", name: "開発部", head: 20, productivity: 130, pulse: 4.1, weather: "sun", kpiAch: 115, kpiName: "リリース件数", respondentsCount: 20, masterHeadcount: 20 },
        { id: "d3", name: "マーケ部", head: 4, productivity: 120, pulse: 4.0, weather: "sun", kpiAch: 110, kpiName: "リード数", respondentsCount: 4, masterHeadcount: 4 },
        { id: "d4", name: "人事部", head: 2, productivity: 90, pulse: 4.0, weather: "sun", kpiAch: 100, kpiName: "採用数", respondentsCount: 2, masterHeadcount: 2 },
        { id: "d5", name: "CS部", head: 15, productivity: 100, pulse: 4.0, weather: "sun", kpiAch: 100, kpiName: "解約抑制率", respondentsCount: 15, masterHeadcount: 15 },
    ]
};

export default function BubbleChartGuidePage() {
    const [guideMonth, setGuideMonth] = useState("default");
    
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Matrix Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    部署別マトリックスの見方
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    組織の「定量（KPI）」と「定性（体温）」を掛け合わせた、Signs AI独自のマトリックス分析を読み解く方法を解説します。
                </p>
            </div>

            {/* Why this matters */}
            <div className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-400" />
                        <span className="text-xs font-black text-teal-400 uppercase tracking-widest">Why this matters</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight">
                        なぜ2軸で組織を見る必要があるのか？
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        KPI（売上、契約数など）だけでは、<strong className="text-white">現場が健全に成果を出しているのか</strong>が見えません。
                        逆に、エンゲージメント（体温）だけでは<strong className="text-white">その熱量がビジネス成果に直結しているのか</strong>が分かりません。
                        この2つの軸を同時に見ることで、初めて「持続可能な成長」と「構造的なリスク」を一覧で捉えることが可能になります。
                    </p>
                </div>
            </div>

            {/* Actual UI Demonstration */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-teal" />
                    インタラクティブ・デモ
                </h2>
                <div className="bg-white rounded-[28px] border-2 border-slate-100 p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 pointer-events-none">
                        <div className="bg-teal text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">Demo</div>
                    </div>
                    <div className="flex flex-col gap-4 mb-6 relative z-10">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">部署 / 担当領域 マトリックス</h3>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                <span>縦軸: 一人当たり生産性 ｜ 横軸: リソース量 ｜ 円サイズ: KPI達成率</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Time Lapse</span>
                            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full z-20">
                                {[{ id: "default", label: "現在" }, { id: "1m", label: "1ヶ月前" }, { id: "3m", label: "3ヶ月前" }, { id: "6m", label: "6ヶ月前" }, { id: "12m", label: "1年前" }].map((t) => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setGuideMonth(t.id)} 
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${guideMonth === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-4">
                        <ScatterPlot 
                            data={dummyHistoricalData[guideMonth]}
                            sizeKpiName="KPI達成率"
                            month={guideMonth}
                        />
                    </div>
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">
                    ▲ 実際の画面と同様に、マウスオーバーやタイムラプス切り替え（上部のボタン）をお試しいただけます
                </p>
            </section>

            {/* Axes explanation */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">軸の意味</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">縦軸：一人当たり生産性</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            各部署のKPI実績を人数で割った<strong>効率性の指標</strong>です。上に位置する部署ほど、少ない人員で大きな成果を出していることを示します。
                        </p>
                        <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-xs font-bold">
                            計算式：KPI達成率 × 体温係数
                        </div>
                    </div>
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">横軸：リソース量</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            部署の人員数を表します。右に位置する部署ほど、多くの人員を有していることを示します。横軸の位置で「少数精鋭か、大所帯か」が一目で分かります。
                        </p>
                        <div className="bg-amber-50 text-amber-700 rounded-xl px-4 py-3 text-xs font-bold">
                            データソース：部署マスタの登録人数
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-teal/5 border border-teal/10 rounded-3xl flex gap-4">
                    <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                        <Target className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">円（バブル）のサイズと波紋</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            バブルの大きさは<strong>KPI達成率</strong>を表しています。大きな円ほど達成度が高い部署です。
                            KPIが100%を達成している部署の周囲には、波紋（リップル）アニメーションが表示されます。
                            また、色は「組織の体温（晴れ・曇り・雨）」などの直感的な指標を反映しています。
                        </p>
                    </div>
                </div>
            </section>

            {/* 4 Quadrants via CSS Grid */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">4つの領域の意味</h2>
                
                {/* CSS Based Quadrant Diagram */}
                <div className="py-12 pr-6 pl-14 md:pl-20 bg-slate-50 border border-slate-200 rounded-[32px] mb-8">
                    <div className="relative w-full max-w-2xl mx-auto aspect-square text-white">
                        {/* Axes */}
                        <div className="absolute top-0 bottom-10 left-4 md:left-6 right-0 border-l-4 border-b-4 border-slate-300">
                            {/* Y-axis arrow & label */}
                            <div className="absolute -top-3 -left-[14px] w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-transparent border-b-slate-300"></div>
                            {/* NOTE: rotate-[-90deg] uses unrotated width/height. Add -translate-x-1/2 to perfectly align the horizontal center. */}
                            <div className="absolute top-1/2 -left-6 md:-left-8 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] origin-center text-slate-500 font-black tracking-widest text-[11px] md:text-xs whitespace-nowrap">一人当たり生産性（高・低）</div>
                            
                            {/* X-axis arrow & label */}
                            <div className="absolute top-full -right-4 -translate-y-[14px] w-0 h-0 border-t-[12px] border-b-[12px] border-l-[16px] border-transparent border-l-slate-300"></div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-5 text-slate-500 font-black tracking-widest text-[11px] md:text-xs whitespace-nowrap">リソース量 / 人数（少・多）</div>
                        </div>

                        {/* Quadrants Grid */}
                        <div className="absolute top-6 left-8 md:left-12 right-6 bottom-16 grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                            <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl shadow-md p-4 flex flex-col items-center justify-center text-center">
                                <span className="font-black text-xl mb-1 drop-shadow-sm">開拓者 (PIONEER)</span>
                                <span className="text-xs font-bold opacity-90 mb-1">少人数 × 高生産性</span>
                                <span className="text-[10px] font-medium opacity-90 leading-tight">理想的な高効率・自律型チーム</span>
                            </div>
                            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl shadow-md p-4 flex flex-col items-center justify-center text-center">
                                <span className="font-black text-xl mb-1 drop-shadow-sm">拡大期 (SCALE)</span>
                                <span className="text-xs font-bold opacity-90 mb-1">多人数 × 高生産性</span>
                                <span className="text-[10px] font-medium opacity-90 leading-tight">組織の成果を牽引する主力部隊</span>
                            </div>
                            <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl shadow-md p-4 flex flex-col items-center justify-center text-center">
                                <span className="font-black text-xl mb-1 drop-shadow-sm">種まき (SEED)</span>
                                <span className="text-xs font-bold opacity-90 mb-1">少人数 × 低生産性</span>
                                <span className="text-[10px] font-medium opacity-90 leading-tight">新規事業やR&Dなどの投資フェーズ</span>
                            </div>
                            <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-3xl shadow-md p-4 flex flex-col items-center justify-center text-center">
                                <span className="font-black text-xl mb-1 drop-shadow-sm">肥大化 (OVERWEIGHT)</span>
                                <span className="text-xs font-bold opacity-90 mb-1">多人数 × 低生産性</span>
                                <span className="text-[10px] font-medium opacity-90 leading-tight">調整コスト増大による改善必須領域</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Growth Philosophy */}
                <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-[32px] mx-auto mb-8 shadow-xl relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                    <div className="relative z-10 space-y-5">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <Compass className="w-6 h-6 text-teal-400" />
                            Signs AIが提唱する「組織成長の哲学」
                        </h3>
                        <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                            組織をスケールさせる際、むやみに人員を増やすのは危険です。<br/>
                            <strong className="text-white">「まずは生産性を高め（上へ移動）、高い生産性を維持したまま人員を拡大する（右へ移動）」</strong>のが鉄則です。
                        </p>
                        <div className="flex flex-col gap-3 text-sm text-slate-300 font-medium bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                            <div className="flex items-baseline gap-3">
                                <span className="text-amber-400 font-black w-14 shrink-0 text-right">STEP 1</span>
                                <p><strong className="text-amber-400">SEED（種まき）</strong> からスタートし、事業の「勝ちパターン」を見つける</p>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-emerald-400 font-black w-14 shrink-0 text-right">STEP 2</span>
                                <p>業務効率と組織体温を高めて生産性を向上させ、<strong className="text-emerald-400">開拓者（PIONEER）</strong> へと引き上げる</p>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-blue-400 font-black w-14 shrink-0 text-right">STEP 3</span>
                                <p>強力なカルチャーと仕組みが確立された高生産性の状態のまま人数を拡大し、<strong className="text-blue-400">拡大期（SCALE）</strong> へ移行する</p>
                            </div>
                        </div>
                        <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                            この理想的な成長パス（<strong className="text-amber-400">SEED</strong> ➔ <strong className="text-emerald-400">PIONEER</strong> ➔ <strong className="text-blue-400">SCALE</strong>）を描けているか、あるいは生産性の低いまま人員を増やしてしまい <strong className="text-rose-400">OVERWEIGHT</strong> に陥っていないかを、タイムラプスで検証することがマトリックスの最大の強みです。
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* SEED (Moved to top logically) */}
                    <div className="flex gap-4 p-6 border border-amber-100 bg-amber-50/50 rounded-[28px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent w-full pointer-events-none" />
                        <div className="text-3xl relative z-10 mt-1">🌱</div>
                        <div className="space-y-3 relative z-10 w-full">
                            <div>
                                <h3 className="text-xl font-black text-amber-800 mb-1">種まき (SEED)</h3>
                                <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold tracking-tight">
                                    <span>左下エリア</span>
                                    <span>|</span>
                                    <span>少人数 × 低生産性</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                新規事業や立ち上げフェーズのチームです。このフェーズでは、まずは<strong>生産性向上（PIONEERへの移動）に集中する</strong>ことが鉄則です。生産性が低いまま人員を増やすと、OVERWEIGHT（肥大化）に直行してしまうため、少人数のうちに「勝ちパターン」を見つけることが最重要になります。
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-amber-800 border border-amber-200/50 flex gap-2">
                                <span className="shrink-0">💡</span>
                                <p>アクション：まずは生産性向上に必要なボトルネックを特定し、業務プロセスの構築とPMF（プロダクトフィット）に集中する。</p>
                            </div>
                        </div>
                    </div>

                    {/* PIONEER */}
                    <div className="flex gap-4 p-6 border border-emerald-100 bg-emerald-50/50 rounded-[28px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent w-full pointer-events-none" />
                        <div className="text-3xl relative z-10 mt-1">⭐</div>
                        <div className="space-y-3 relative z-10 w-full">
                            <div>
                                <h3 className="text-xl font-black text-emerald-800 mb-1">開拓者 (PIONEER)</h3>
                                <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold tracking-tight">
                                    <span>左上エリア</span>
                                    <span>|</span>
                                    <span>少人数 × 高生産性</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                少人数で高い成果を出している、組織の理想形となるチームです。SEEDから着実に成長し、自律的な高効率組織となった状態です。この「高生産性・高体温」のカルチャーや業務の仕組みが確立された状態で初めて、<strong>採用を強化し SCALE（拡大期）へと移行する</strong>準備が整います。
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-emerald-800 border border-emerald-200/50 flex gap-2">
                                <span className="shrink-0">💡</span>
                                <p>アクション：成功要因（カルチャー、ツール、仕組み）を言語化し、拡大に向けたオンボーディングの土台としてマニュアル化する。</p>
                            </div>
                        </div>
                    </div>

                    {/* SCALE */}
                    <div className="flex gap-4 p-6 border border-blue-100 bg-blue-50/50 rounded-[28px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent w-full pointer-events-none" />
                        <div className="text-3xl relative z-10 mt-1">🚀</div>
                        <div className="space-y-3 relative z-10 w-full">
                            <div>
                                <h3 className="text-xl font-black text-blue-800 mb-1">拡大期 (SCALE)</h3>
                                <div className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold tracking-tight">
                                    <span>右上エリア</span>
                                    <span>|</span>
                                    <span>多人数 × 高生産性</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                PIONEERで確立された高い生産性を維持したまま、人員拡大に成功している組織の主力部隊です。この状態をいかに長く維持するかが企業収益の鍵となります。人数増加に伴うコミュニケーションコストの増大やサイロ化によって生産性が落ち、OVERWEIGHTへ転落しないよう監視が必要です。
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-blue-800 border border-blue-200/50 flex gap-2">
                                <span className="shrink-0">💡</span>
                                <p>アクション：中間管理職の育成や、1on1の充実などによるエンゲージメント維持施策を強化し、大所帯ならではの組織疲労を予防する。</p>
                            </div>
                        </div>
                    </div>

                    {/* OVERWEIGHT */}
                    <div className="flex gap-4 p-6 border border-rose-100 bg-rose-50/50 rounded-[28px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent w-full pointer-events-none" />
                        <div className="text-3xl relative z-10 mt-1">⚠️</div>
                        <div className="space-y-3 relative z-10 w-full">
                            <div>
                                <h3 className="text-xl font-black text-rose-800 mb-1">肥大化 (OVERWEIGHT)</h3>
                                <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-800 px-3 py-1 rounded-lg text-xs font-bold tracking-tight">
                                    <span>右下エリア</span>
                                    <span>|</span>
                                    <span>多人数 × 低生産性</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                人員に対するリターンが見合っておらず、構造的な改善が必要なリスク領域です。<strong>「生産性が低いSEEDの状態で無理に人員を増やしてしまった」</strong>、あるいは<strong>「SCALEから組織規模が拡大しすぎて生産性が落ちてしまった」</strong>結果として行き着く状態です。
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-rose-800 border border-rose-200/50 flex gap-2">
                                <span className="shrink-0">💡</span>
                                <p>アクション：採用を一旦ストップし、業務の棚卸しと構造的改善を実施する。場合によってはPIONEERレベルの少人数チームに分割する等の抜本的対策を検討する。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* View modes */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Maximize2 className="w-6 h-6 text-teal" />
                    表示モードとその他機能
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                        <h3 className="text-sm font-black text-slate-900">📋 部署別（現在の表示）</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            営業部、開発部、CS部などの組織単位でプロットします。部署間の生産性バランスを俯瞰するのに最適です。
                        </p>
                    </div>
                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                        <h3 className="text-sm font-black text-slate-900">🏷️ 担当領域別</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            プロダクト、エリア、ブランドなどの切り口でプロットします。同一部署内でも異なる領域のパフォーマンス差が見えるようになります。
                        </p>
                    </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-slate-400" />
                        タイムラプスで何が見えるのか？
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        上記のデモ上部にあるボタンで過去に遡ることができます。バブルが時間の経過とともに<strong>どう移動したか（左上へ向かっているか等）</strong>や、<strong>サイズがどう変化したか</strong>を追跡することで、組織の変化のトレンドを的確に捉えることができます。
                    </p>
                </div>
            </section>

            {/* Next buttons */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/kpi-setup" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    KPIの設定と入力
                </Link>
                <Link href="/docs" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    ドキュメントトップへ
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
