import React from 'react';
import { CheckSquare, ListTodo, Plus, Clock, Archive } from 'lucide-react';

export default function ActionGuidePage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <CheckSquare className="w-3.5 h-3.5" />
                    How to Use
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    「アクション管理」の使い方
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">
                    分析結果を見て終わるのではなく、<strong>「次どうするか」を行動に移すこと</strong>がSigns AIのゴールです。<br/>
                    アクション管理機能では、AIが提案したネクストアクションのステータスを管理したり、自律的に追加したTo-Doをチームでトラッキングすることができます。
                </p>
            </section>

            {/* Core Mechanics */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                        <ListTodo className="w-5 h-5" />
                    </div>
                    <h2 id="ai-proposals" className="text-2xl font-black text-slate-800 tracking-tight">
                        AI提案の管理（ステータス変更）
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose mb-6">
                    <p>
                        毎月のAI分析後、ダッシュボードの「アクション提案」セクションには、組織方針と各部署の状況に基づいた具体的な施策が自動で提案されます。<br/>
                        提案されたアクションは、<strong>「未判断」→「実行中」</strong>という2段階のステップで進めます。それぞれの段階で選べる操作は次のとおりです。
                    </p>
                </div>

                {/* Stage 1: 未判断 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stage 01</span>
                        <h4 className="font-black text-slate-800">未判断のアクション</h4>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        提案された直後のアクションは「未判断」の状態です。内容を確認し、次の3つから対応を選びます。
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <h5 className="font-bold text-slate-800">採用して実行</h5>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                チームで取り組むことを決定し、アクションを「実行中」に移します。この状態のアクションは、翌月のAI分析時に「取り組み中の施策」としてAIに共有され、評価の対象となります。
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <h5 className="font-bold text-slate-800">キープ</h5>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                「良いアイデアだが今すぐには着手できない」など、保留にしておく選択です。翌月に状況が変わった際、実行へ移すための備忘録として機能します。
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                <h5 className="font-bold text-slate-800">不採用</h5>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                自社の実情に合わない、または不要と判断した場合の選択です。これを選ぶとAIにフィードバックされ、次回以降の提案の精度が向上します。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stage 2: 実行中 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stage 02</span>
                        <h4 className="font-black text-slate-800">実行中のアクション</h4>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        「採用して実行」を選んだアクションは「実行中」になります。取り組みが一段落したら、次の2つから対応を選びます。
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <h5 className="font-bold text-slate-800">完了</h5>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                実行し、やり切ったアクションに付けます。完了にするとダッシュボードの表示からは消え、アーカイブ（過去履歴）へと移動します。
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                <h5 className="font-bold text-slate-800">中止</h5>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                状況の変化などで取り組みを取りやめる場合に選びます。中止したアクションもアーカイブへ移動し、履歴として振り返ることができます。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Manual Actions */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mt-8">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h2 id="manual-actions" className="text-2xl font-black text-slate-800 tracking-tight">
                        手動アクションの追加
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        AIの提案だけでなく、1on1や経営会議などで独自に決定した施策もSigns AI上で一元管理できます。
                    </p>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
                    <h4 className="font-bold text-indigo-900 mb-4">手動追加の手順</h4>
                    <ol className="space-y-3 list-decimal list-inside text-sm text-indigo-800 font-medium">
                        <li>アクション一覧の右上にある「新しいアクションを追加」ボタンをクリックします。</li>
                        <li>アクションのタイトル（タイトルのみ必須）と、必要に応じて詳細な背景を入力します。</li>
                        <li>対象となる「部署」と「優先度（高/中/低）」を選択して保存します。</li>
                    </ol>
                    <p className="text-xs text-indigo-600 mt-4 leading-relaxed">
                        ※手動で追加したアクションも、AI提案と同じく「実行中」にすると次回のAI分析時に『現在組織が取り組んでいる施策』としてAIにインプットされ、現在地の評価に反映されます。
                    </p>
                </div>
            </section>

            {/* Archive and History */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mt-8">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                        <Archive className="w-5 h-5" />
                    </div>
                    <h2 id="archive" className="text-2xl font-black text-slate-800 tracking-tight">
                        アーカイブと履歴の振り返り
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        「完了」「中止」「不採用」にしたアクションや、前月以前のアクションはすべて自動的に<strong>アーカイブ（履歴）</strong>へ保存されます。
                    </p>
                    <p>
                        画面上部の「アーカイブを見る」タブをクリックすることで、過去にどのような施策を取り入れ、どれが完了したのかをいつでも時系列で振り返ることができます。もし誤って操作してしまった場合でも、アーカイブ画面から元の状態に戻すことができます。
                    </p>
                </div>
            </section>

        </div>
    );
}
