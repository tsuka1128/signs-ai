"use client";

import React, { useState } from 'react';
import { Target, BrainCircuit, MessageSquare, Lightbulb, AlertCircle, Copy, Check } from 'lucide-react';

export default function PolicyGuidePage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <Target className="w-3.5 h-3.5" />
                    How to Use
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    「組織方針」の登録
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">
                    Signs AIの最大の特徴は、一般的なAIデータ分析ツールと異なり、<strong>あなたの会社の文脈（コンテキスト）</strong>を理解して分析できる点にあります。その心臓部となるのが「組織方針」の登録機能です。
                </p>
            </section>

            {/* Semantic Layer Concept */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <h2 id="what-is-semantic-layer" className="text-2xl font-black text-slate-800 tracking-tight">
                        セマンティックレイヤー（意味の階層）とは
                    </h2>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                        <p>
                            Signs AIにおいて、組織方針は単なるメモではありません。AIが数字を解釈するための<strong className="text-indigo-600">「レンズ」</strong>の役割を果たします。
                        </p>
                        <p>
                            例えば「退職率の上昇」という一つの事実も、組織方針によってAIの解釈は180度変わります。
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                            <div className="p-5 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-2xl text-xs sm:text-sm font-bold text-emerald-800 shadow-sm transition-transform hover:scale-[1.02]">
                                <span className="block text-[10px] text-emerald-600 uppercase tracking-widest mb-1.5 font-black">Case A: 拡大フェーズ</span>
                                「多少の離職は許容範囲。採用と教育の速度を落とさず突き進むべし」 ➔ AIはポジティブな改善策（採用加速など）を提案
                            </div>
                            <div className="p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-xs sm:text-sm font-bold text-amber-800 shadow-sm transition-transform hover:scale-[1.02]">
                                <span className="block text-[10px] text-amber-600 uppercase tracking-widest mb-1.5 font-black">Case B: 安定・質重視フェーズ</span>
                                「1人の離職も重大なアラート。即座に組織崩壊の兆候として捉える」 ➔ AIは緊急の警告と個別のフォローアップを提案
                            </div>
                        </div>
                    </div>
                    
                    {/* Markdown Mockup with Copy Feature */}
                    <PolicySampleCard />
                </div>
            </section>

            {/* Writing Points */}
            <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <h2 id="writing-tips" className="text-2xl font-black text-slate-800 tracking-tight">
                        価値ある「組織方針」を書く6つのポイント
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { 
                            title: "組織のフェーズを定義する", 
                            tags: ["PMF探索", "垂直立ち上げ", "成長加速", "構造改革"],
                            desc: "今、組織がどのステージにあり、何に耐えられる時期なのか、AIにコンテキストを共有します。"
                        },
                        { 
                            title: "目指すべき姿と優先順位", 
                            tags: ["利益 vs 売上", "質 vs スピード", "新規 vs 既存"],
                            desc: "トレードオフが発生した際に、現場がどちらを優先すべきかの指標になります。"
                        },
                        { 
                            title: "直面している課題", 
                            tags: ["採用難", "属人化", "離職防止", "生産性向上"],
                            desc: "AIが毎月のデータを読み解く際に、特に「警戒して探すべきリスク」を事前に教えます。"
                        },
                        { 
                            title: "KPIへの「意図」を込める", 
                            tags: ["KPI達成を最優先", "数字の裏のプロセス重視"],
                            desc: "単なる計算機としてのAIではなく、経営者の執着心やこだわりを分析のレンズにします。"
                        },
                        { 
                            title: "気になるキーワード", 
                            tags: ["特定競合名", "注力サービス名", "懸念事象"],
                            desc: "現場のボイスチェックから、AIに必ず拾わせたい、もしくは注意したい単語を指定します。"
                        },
                        { 
                            title: "経営陣の「生の言葉」", 
                            tags: ["きれいな文章不要", "熱量とコンテキスト"],
                            desc: "箇条書きで構いません。きれいな一般論よりも、その時々の生々しい文脈がAIの洞察を深めます。"
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white border-2 border-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-teal/20 transition-all duration-300 space-y-4">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal" />
                                {item.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 font-bold">
                                {item.tags.map((t, ti) => (
                                    <span key={ti} className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">#{t}</span>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How to set */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h2 id="setup-procedure" className="text-2xl font-black text-slate-800 tracking-tight">
                        登録・更新の手順
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="group space-y-4 p-6 bg-white border-2 border-slate-50 rounded-[32px] hover:border-teal/20 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-teal group-hover:text-white transition-colors">1</div>
                        <div>
                            <h4 className="font-black text-slate-800 mb-2">入力エリアへ</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                ダッシュボード上部の「組織方針」セクション、または設定画面のセマンティックレイヤー管理を開きます。
                            </p>
                        </div>
                    </div>
                    <div className="group space-y-4 p-6 bg-white border-2 border-slate-50 rounded-[32px] hover:border-teal/20 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-teal group-hover:text-white transition-colors">2</div>
                        <div>
                            <h4 className="font-black text-slate-800 mb-2">コンテキストを入力</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                上記のポイントを参考に記載。キックオフ資料からの転記も有効です。Markdownが自動適用されます。
                            </p>
                        </div>
                    </div>
                    <div className="group space-y-4 p-6 bg-white border-2 border-slate-50 rounded-[32px] hover:border-teal/20 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-teal group-hover:text-white transition-colors">3</div>
                        <div>
                            <h4 className="font-black text-slate-800 mb-2">定期的な更新</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                四半期や各月の状況変化に合わせて更新。AIは常に「最新の方針」を前提としてデータを解析します。
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-6 flex gap-4 mt-6">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm text-amber-900 font-black">管理者のみ設定可能</p>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            組織方針の変更は管理者権限を持つユーザーのみが行えます。更新内容は、次回のAI解析周期からすべてのレポートとアクション提案に即座に反映されます。
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// 表示とコピーで内容がズレないよう、サンプル方針文を単一の定数に統合
const CURRENT_STATE_LINES = [
    "- フェーズ: 成長加速期",
    "- 現在の優先順位: 顧客満足度の向上 ＞ 拡大スピード",
    "- 組織の目標: 全員が自律的に動き、顧客価値を最大化する組織の構築",
];

const KPI_GUIDE_LINES = [
    "1. 売上高: 短期的なハックによる達成は不要。持続可能な成長カーブを重視する。",
    "2. 売上総利益率: プロダクト価値の源泉。ここが0.5%でも下落したら、コスト構造か競合環境に異常があると判断。",
    "3. 新規獲得数: ターゲット属性との一致を重視。無理な獲得による将来のチャーンリスクは避ける。",
    "4. チャーンレート: 1.5%を超えたら緊急事態。プロダクトかCSの体制に即座にメスを入れる。",
    "5. 一人当たり生産性: 採用が進む中でも、この数字が維持・向上している限りはアクセルを踏み続ける。",
    "6. 短期離職率: 数字そのものより、その裏にある「オンボーディング不全」の兆候をAIに拾わせたい。",
    "7. 内定承諾率: 我々のブランド力のバロメーター。低下は選考体験の劣化とみなす。",
    "8. eNPS: 組織の基礎体力。極端な悪化は半年後の離職増加を予見するため、最重要先行指標とする。",
];

const NOTES_LINES = [
    "- 部門間の情報の不透明性を排除する",
    "- 「現場の声」が経営・意思決定に反映されている状態を維持する",
];

const KEYWORDS_LINE = "- 粗利率, 競合, 売上, 失注, 営業利益, 新卒, 開発";

const POLICY_SAMPLE_TEXT = `# 組織方針 v1.0

## 組織の現在地
${CURRENT_STATE_LINES.join("\n")}

## KPIの解釈ガイド
${KPI_GUIDE_LINES.join("\n")}

## 組織の注意点
${NOTES_LINES.join("\n")}

## 気になるキーワード（カンマ区切り）
${KEYWORDS_LINE}`;

function PolicySampleCard() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(POLICY_SAMPLE_TEXT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 rounded-[32px] p-6 sm:p-10 shadow-2xl relative group overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-16 bg-teal-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-rose-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-amber-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors" />
                </div>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        copied 
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            コピーしました
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            テンプレートをコピー
                        </>
                    )}
                </button>
            </div>

            <div className="font-mono text-[12px] sm:text-[14px] leading-relaxed text-slate-300 relative z-10 overflow-x-auto space-y-4">
                <div>
                    <span className="text-slate-500 block mb-2 font-sans italic tracking-wider">// そのまま登録に使える標準テンプレート</span>
                    <span className="text-teal-400 font-black block mb-4 text-xl sm:text-2xl tracking-tight"># 組織方針 v1.0</span>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <p className="text-teal-400 font-black flex items-center gap-2 text-sm sm:text-base tracking-tight">
                            <span className="w-2 h-2 bg-teal-500 rounded-full" />
                            ## 組織の現在地
                        </p>
                        <div className="pl-6 space-y-1 font-bold">
                            {CURRENT_STATE_LINES.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-teal-400 font-black flex items-center gap-2 text-sm sm:text-base tracking-tight">
                            <span className="w-2 h-2 bg-teal-500 rounded-full" />
                            ## KPIの解釈ガイド
                        </p>
                        <div className="pl-6 space-y-2 text-slate-400 font-bold">
                            {KPI_GUIDE_LINES.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-teal-400 font-black flex items-center gap-2 text-sm sm:text-base tracking-tight">
                            <span className="w-2 h-2 bg-teal-500 rounded-full" />
                            ## 組織の注意点
                        </p>
                        <div className="pl-6 space-y-1 font-bold">
                            {NOTES_LINES.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-teal-400 font-black flex items-center gap-2 text-sm sm:text-base tracking-tight">
                            <span className="w-2 h-2 bg-teal-500 rounded-full" />
                            ## 気になるキーワード
                        </p>
                        <div className="pl-6 font-bold">
                            <p className="text-slate-400">{KEYWORDS_LINE}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-800 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Semantic Context Ready</span>
                </div>
            </div>
        </div>
    );
}
