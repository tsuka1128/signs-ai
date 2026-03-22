import React from 'react';
import { Target, BrainCircuit, MessageSquare, Lightbulb, AlertCircle } from 'lucide-react';

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
                    Signs AIの最大の特徴は、一般的なAIデータ分析ツールと異なり、**あなたの会社の文脈（コンテキスト）**を理解して分析できる点にあります。その心臓部となるのが「組織方針」の登録機能です。
                </p>
            </section>

            {/* Semantic Layer Concept */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        セマンティックレイヤー（意味の階層）とは
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                        <p>
                            Signs AIにおいて、組織方針は単なるメモではありません。AIが数字を解釈するための<strong className="text-indigo-600">「レンズ」</strong>の役割を果たします。
                        </p>
                        <p>
                            例えば「退職率の上昇」という一つの事実も、組織方針によってAIの解釈は180度変わります。
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-2xl text-xs sm:text-sm font-bold text-emerald-800 shadow-sm transition-transform hover:scale-[1.02]">
                                <span className="block text-[10px] text-emerald-600 uppercase tracking-widest mb-1">Case A: 拡大フェーズ</span>
                                「多少の離職は許容。採用と教育の速度を落とさず突き進む」 ➔ AIはポジティブな改善策を提案
                            </div>
                            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-xs sm:text-sm font-bold text-amber-800 shadow-sm transition-transform hover:scale-[1.02]">
                                <span className="block text-[10px] text-amber-600 uppercase tracking-widest mb-1">Case B: 安定・質重視フェーズ</span>
                                「1人の離職も重大なアラート。即座に組織崩壊の兆候として捉える」 ➔ AIは緊急の警告とフォローを提案
                            </div>
                        </div>
                    </div>
                    
                    {/* Markdown Mockup */}
                    <div className="bg-slate-900 rounded-[32px] p-6 sm:p-8 shadow-2xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 bg-teal-500/5 rounded-full blur-3xl -mr-6 -mt-6" />
                        <div className="absolute top-6 left-8 flex gap-1.5 z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-rose-500 transition-colors" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-amber-500 transition-colors" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors" />
                        </div>
                        <div className="mt-8 font-mono text-[11px] sm:text-[13px] leading-relaxed text-slate-300 relative z-10">
                            <p className="text-slate-500 mb-2"># 登録サンプル (Markdown形式)</p>
                            <p className="text-teal-400 font-bold"># 組織方針 v1.0</p>
                            <br/>
                            <p className="text-teal-400 font-bold">## 組織の現在地</p>
                            <p>- フェーズ: 成長加速期</p>
                            <p>- 優先順位: 顧客満足度 ＞ 拡大スピード</p>
                            <br/>
                            <p className="text-teal-400 font-bold">## KPIの解釈ガイド</p>
                            <p>- 退職率は3%までは許容。ただしエース級は死守</p>
                            <p>- 予実の乖離は「理由の透明性」があれば不問</p>
                            <br/>
                            <p className="text-teal-400 font-bold">## 気になるキーワード</p>
                            <p>- 粗利率, 競合, エース, 離職の兆候</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Semantic Layer Active</span>
                            </div>
                            <span className="text-[10px] font-black text-teal-500 bg-teal/10 px-3 py-1 rounded-full border border-teal-500/20">AI Read Quality: High</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Writing Points */}
            <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
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
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
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
