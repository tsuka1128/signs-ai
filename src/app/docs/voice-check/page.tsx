import Link from "next/link";
import { ArrowRight, MessageSquareHeart, Shield, Clock, ListChecks, PenLine, Send } from "lucide-react";

/**
 * ボイスチェック（アンケート）回答ガイド
 * メンバーが毎月回答するアンケートの目的・手順・ポイントを解説
 */
export default function VoiceCheckPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Voice Check Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    ボイスチェック回答ガイド
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    月に1回、あなたの「体温」を組織に届けるアンケートです。率直な声が、組織をより良くする原動力になります。
                </p>
            </div>

            {/* ボイスチェックとは？ */}
            <section className="space-y-6">
                <h2 id="what-is-voice-check" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <MessageSquareHeart className="w-7 h-7 text-teal" />
                    ボイスチェックとは？
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    ボイスチェックは、組織のメンバー一人ひとりが「今、現場でどう感じているか」を伝えるための<strong>匿名アンケート</strong>です。回答は毎月1回で、11の設問に5段階評価で答え、自由記述で声を届けます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-teal-50/50 border border-teal-100/50 rounded-2xl text-center space-y-2">
                        <Clock className="w-6 h-6 text-teal mx-auto" />
                        <div className="text-xs font-black text-teal-700 uppercase">頻度</div>
                        <div className="text-sm font-bold text-slate-700">月1回</div>
                    </div>
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-center space-y-2">
                        <ListChecks className="w-6 h-6 text-indigo-500 mx-auto" />
                        <div className="text-xs font-black text-indigo-700 uppercase">所要時間</div>
                        <div className="text-sm font-bold text-slate-700">約5〜10分</div>
                    </div>
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-center space-y-2">
                        <Shield className="w-6 h-6 text-emerald-500 mx-auto" />
                        <div className="text-xs font-black text-emerald-700 uppercase">匿名性</div>
                        <div className="text-sm font-bold text-slate-700">完全匿名</div>
                    </div>
                </div>
            </section>

            {/* 匿名性の保証 */}
            <section className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 space-y-4">
                    <h2 id="anonymity" className="text-xl font-black flex items-center gap-2">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        匿名性について
                    </h2>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                        ボイスチェックの回答は、<strong className="text-white">誰が書いたか特定されない形</strong>で集計されます。
                    </p>
                    <ul className="space-y-2 text-sm font-medium text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            個人の回答は管理者にも表示されません
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            結果は部署単位の平均スコアとしてのみ表示されます
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            自由記述は部署の回答として集約され、個人は特定できません
                        </li>
                    </ul>
                    <p className="text-xs text-slate-400 font-bold mt-4">
                        💡 安心して率直な声をお聞かせください。この仕組みがあるから、本当の課題が見えてきます。
                    </p>
                </div>
            </section>

            {/* 回答の流れ */}
            <section className="space-y-6">
                <h2 id="answer-flow" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <PenLine className="w-7 h-7 text-teal" />
                    回答の流れ
                </h2>

                <div className="space-y-5">
                    {/* Step 1 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">1</div>
                        <div className="space-y-3 w-full">
                            <h3 id="flow-step1" className="text-lg font-black text-slate-800">所属情報の選択</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                まず<strong>所属部署</strong>を選択します。組織で「担当領域」（地域・プロダクト等）が設定されている場合は、そちらも選択します。これにより、回答がどの部署・領域に紐づくかが決まります。
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">2</div>
                        <div className="space-y-3 w-full">
                            <h3 id="flow-step2" className="text-lg font-black text-slate-800">11の設問への5段階評価</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                「最近1ヶ月の状況について」11の質問に、<strong>1（全くない）〜 5（強く想う）</strong>の5段階で回答します。直感で答えてください。正解・不正解はありません。
                            </p>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">設問の例</div>
                                <ul className="text-xs text-slate-600 font-medium space-y-1">
                                    <li>• 業務を通じてKPI達成に貢献できていると感じる</li>
                                    <li>• チーム内で率直なフィードバックを受けている</li>
                                    <li>• 組織の方向性や方針が明確に伝わっている</li>
                                    <li>• 新しいことに挑戦できる環境がある</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">3</div>
                        <div className="space-y-3 w-full">
                            <h3 id="flow-step3" className="text-lg font-black text-slate-800">KPI改善に関する記述（100文字以上）</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                「KPI達成・成長のために、改善すると良さそうな点」を<strong>100文字以上</strong>の自由記述で回答します。
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold text-amber-800">
                                ⚠️ この欄は必須です。100文字を超えないと送信ボタンが有効になりません。
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                例：「マーケ部が集めてくれるリードの質が上がり、商談はしやすくなっています。ただ、開発部への依頼フローが複雑で、お客様への提案スピードが落ちている場面があります。」
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">4</div>
                        <div className="space-y-3 w-full">
                            <h3 id="flow-step4" className="text-lg font-black text-slate-800">本音（任意）& 送信</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                「組織や経営陣に伝えておきたい本音」を自由に記入できます（任意）。すべての回答が完了したら、<strong>「アンケートを送信する」</strong>ボタンをタップして完了です。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* URLの共有方法 */}
            <section className="space-y-6">
                <h2 id="share-url" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Send className="w-7 h-7 text-teal" />
                    管理者向け：回答URLの共有方法
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    ボイスチェックのURLをメンバーに配布する方法です。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">基本URL</div>
                        <code className="block bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700">
                            https://signs-ai.vercel.app/form
                        </code>
                        <p className="text-xs text-slate-500 font-medium">
                            ログイン中のユーザーは自動的に所属企業のフォームが表示されます。
                        </p>
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">配布のタイミング</div>
                        <ul className="text-sm text-slate-600 font-medium space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-teal mt-0.5">📅</span>
                                毎月1日〜5日頃に Slack チャンネルやメールで共有するのがおすすめです
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-teal mt-0.5">🔔</span>
                                Slack連携を設定済みの場合、自動通知で配布を効率化できます
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Navigation */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/member-management" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    メンバーの招待・管理
                </Link>
                <Link href="/docs/kpi-input" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    KPI実績の入力方法
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
