import React from 'react';
import { Target, Search, BarChart3, Lightbulb, PenLine, Send, RefreshCcw, ArrowDown } from 'lucide-react';

export default function PDCAGuidePage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    How to Use
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    Signs AIを活用した<br className="md:hidden" />「組織改善のPDCA」
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mt-4">
                    Signs AIは、月次のダッシュボードを眺めて満足するためのツールではありません。発見から施策の実行、そして振り返りまでの一連のサイクルを回すことで初めて真の価値を発揮します。
                </p>
            </section>

            {/* The PDCA Visual Timeline */}
            <section className="relative mt-16 max-w-2xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-slate-100 hidden md:block" />

                <div className="space-y-8 relative">
                    {/* Step 1 */}
                    <div className="flex gap-6 relative">
                        <div className="hidden md:flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 relative z-10 text-slate-600">
                                <Search className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 flex-1 shadow-sm relative overflow-hidden group hover:border-teal-200 transition-colors">
                            <div className="absolute top-0 right-0 p-16 bg-white/50 rounded-full blur-2xl -mr-12 -mt-12" />
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 block">Step 01</span>
                            <h3 id="discovery" className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
                                <Search className="w-5 h-5 text-teal-500 md:hidden" />
                                マトリックスから「課題」を発見する
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                まずは「バブルチャート（マトリックス）」を開き、各部署の現在地を確認します。とくに「右下（OVERWEIGHT／要テコ入れ）」に落ち込んでいる部署、あるいは生産性が急激に悪化している部署を見つけ出します。
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-6 relative">
                        <div className="hidden md:flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 relative z-10 text-slate-600">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 flex-1 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 block">Step 02</span>
                            <h3 id="identification" className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500 md:hidden" />
                                KPIと体温で「原因」を特定する
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                課題のある部署を見つけたら、なぜその位置にいるのかを深掘りします。それぞれの部署の「KPI推移」と「組織の体温（アンケート結果）」のタブを確認し、売上が落ちているのか、それともメンバーの燃え尽きが起きているのかなど、根本原因を特定します。
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-6 relative">
                        <div className="hidden md:flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 relative z-10 text-slate-600">
                                <Lightbulb className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100 rounded-[24px] p-6 flex-1 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                            <span className="text-xs font-black tracking-widest text-amber-500/50 uppercase mb-1 block">Step 03</span>
                            <h3 id="action" className="text-xl font-black text-amber-900 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-500 md:hidden" />
                                AI提案をもとに「施策（アクション）」を決める
                            </h3>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                具体的な打ち手は、ダッシュボードの「アクション提案」に乗っています。AIがコンテキストを読み解いて立案した施策の中から、自社で取り組むべきものを選び、<strong>「採用して実行」</strong>を選択します。もちろん、1on1で決めた独自のアクションを手動で追加することも可能です。
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-6 relative">
                        <div className="hidden md:flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 relative z-10 text-slate-600">
                                <PenLine className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 flex-1 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 block">Step 04</span>
                            <h3 id="policy" className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
                                <PenLine className="w-5 h-5 text-slate-500 md:hidden" />
                                「組織方針」をアップデートする
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                実行中のアクションや、これから重点的に取り組む経営方針（例：「今月はA部署の離職防止を最優先とする」など）を、<strong>「組織方針」</strong>のテキストエリアに入力して更新します。これにより、AIが「会社がいま何をしようとしているのか」を正確に学習し、次回の分析精度が飛躍的に高まります。
                            </p>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-6 relative">
                        <div className="hidden md:flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 relative z-10 text-slate-600">
                                <Send className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="bg-sky-50/50 border border-sky-100 rounded-[24px] p-6 flex-1 shadow-sm relative overflow-hidden group hover:border-sky-300 transition-colors">
                            <span className="text-xs font-black tracking-widest text-sky-500/50 uppercase mb-1 block">Step 05</span>
                            <h3 id="notification" className="text-xl font-black text-sky-900 mb-3 flex items-center gap-2">
                                <Send className="w-5 h-5 text-sky-500 md:hidden" />
                                「部署への通知」を活用して伝達する
                            </h3>
                            <p className="text-sm text-sky-800 leading-relaxed font-medium">
                                ダッシュボード右上にある<strong>「各部署へのAI通知プレビュー」</strong>を開きます。ここには、変更された組織方針と、実行中アクションをすべて踏まえた上で、「各部署のメンバーへ向けた最適な伝達メッセージ」がAIによって自動生成されています。このテキストをコピーし、各部署のマネージャーやSlackチャンネルへ共有して、全員の目線を合わせます。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Final Loop Result */}
                <div className="mt-12 text-center flex flex-col items-center">
                    <ArrowDown className="w-8 h-8 text-slate-300 mb-4 animate-bounce" />
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 opacity-50" />
                        <h3 id="verification" className="text-xl md:text-2xl font-black mb-3 relative z-10">
                            1ヶ月後、変化をマトリックスで確認する
                        </h3>
                        <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed relative z-10">
                            翌月の頭に、再びバブルチャートを開いてください。そこで<strong>「軌跡（動く地図）」</strong>を使うと、過去数ヶ月の変化がアニメーションで再生されます（軌跡は履歴が12ヶ月に満たない場合は表示されません）。<br/><br/>
                            あなたが行った施策のもとで、課題のあった部署が右上（PIONEER / SCALE）に向かって動いていれば、そのPDCAは大成功です。<br/>もし動いていなければ、あるいは悪化していれば、Step 1に戻って新たな課題特定とアクションを立案しましょう。
                        </p>
                    </div>
                </div>

            </section>
        </div>
    );
}
