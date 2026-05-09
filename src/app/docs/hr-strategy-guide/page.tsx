import Link from "next/link";
import { ArrowRight, Crown, AlertTriangle, TrendingUp, Brain, BarChart3 } from "lucide-react";

export default function HrStrategyGuidePage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">HR Strategy Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        人事戦略インサイトの使い方
                    </h1>
                    <span className="text-sm font-black text-amber-500 border border-amber-300 rounded-lg px-2.5 py-1 leading-none flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        Pro
                    </span>
                </div>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    KPIと組織体温を掛け合わせ、離職リスクの予兆検知・エンゲージメント改善・AI人事戦略提言を行うProプラン専用機能です。
                </p>
            </div>

            {/* Pro バナー */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-5 flex items-start gap-4">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-black text-amber-700 mb-1">Proプラン限定機能</p>
                    <p className="text-sm text-amber-600 font-medium leading-relaxed">
                        人事戦略インサイトは、<strong>人件費分析オプション（Proプラン）</strong>が有効なアカウントのみ利用できます。サイドバーの「人事戦略」メニューから開いてください。プランの変更は管理者にお問い合わせください。
                    </p>
                </div>
            </div>

            {/* Section ① リスクアラート */}
            <section className="space-y-4">
                <h2 id="risk-alerts" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-rose-500" />
                    リスクアラート
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    各部署の状態を自動分析し、注意が必要なシグナルをアラートとして表示します。毎月のアンケートとKPIデータが蓄積されるほど精度が上がります。
                </p>
                <div className="space-y-3">
                    {[
                        { level: "critical", label: "緊急", color: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500", desc: "即座に対応が必要な状態。体温が危険域・急落など深刻なシグナルが複数重なっています。" },
                        { level: "warning", label: "警告", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400", desc: "早期対応を推奨。体温低迷・KPI未達・回答率低下など改善が必要なシグナルが検出されています。" },
                        { level: "info",    label: "注意", color: "bg-blue-50 border-blue-200 text-blue-700",  dot: "bg-blue-400", desc: "軽微なシグナル。現時点では深刻ではありませんが、継続して観察してください。" },
                    ].map((item) => (
                        <div key={item.level} className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${item.color}`}>
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
                            <div>
                                <p className="text-sm font-black mb-0.5">{item.label}</p>
                                <p className="text-sm font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section ② エンゲージメントドライバー分析 */}
            <section className="space-y-6">
                <h2 id="driver-analysis" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-teal-500" />
                    エンゲージメントドライバー分析
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    11設問のスコアと部署KPI達成率の相関を計算し、<strong>「何がKPIに影響しているか」を数値で可視化</strong>します。感覚ではなくデータに基づいて、どこに手を打つべきかを判断できます。
                </p>

                {/* バーの読み方 */}
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">バーの読み方</p>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-black text-teal-700 mb-1">右（＋）に伸びる → 強化すべきドライバー</p>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    スコアが高い部署ほどKPIも高い傾向があります。この設問テーマを組織全体で底上げすると、業績改善につながる可能性が高いです。<strong>まず正の相関が強い項目から施策を打つ</strong>のが基本方針です。
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-black text-rose-700 mb-1">左（－）に伸びる → 構造的な課題のサイン</p>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    スコアは高いのにKPIが低い、という逆転現象です。「頑張っているのに成果が出ない」状態を示しており、<strong>評価制度・業務フロー・リソース配分など設問テーマ以外に根本原因がある</strong>可能性を示します。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 数値の目安 */}
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">数値の目安</p>
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        {[
                            { range: "±0.7 〜 ±1.0", level: "強い相関", color: "bg-teal-50 text-teal-700", desc: "この設問テーマはKPIと強く連動しています。施策の優先度を最上位に置いてください。" },
                            { range: "±0.4 〜 ±0.7", level: "中程度の相関", color: "bg-amber-50 text-amber-700", desc: "一定の関連があります。他の強相関項目への対応と並行して検討する価値があります。" },
                            { range: "±0.0 〜 ±0.4", level: "弱い相関", color: "bg-slate-50 text-slate-500", desc: "現時点ではKPIへの影響が小さい傾向です。優先順位は下げて様子を見ましょう。" },
                        ].map((item, i) => (
                            <div key={i} className={`px-5 py-4 flex items-start gap-4 ${i !== 0 ? "border-t border-slate-100" : ""}`}>
                                <div className={`rounded-lg px-3 py-1.5 text-xs font-black flex-shrink-0 ${item.color}`}>
                                    {item.range}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 mb-0.5">{item.level}</p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ユースケース */}
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">こんなときどう使う？</p>
                    <div className="space-y-3">
                        {[
                            {
                                situation: "「意思決定の速さ」が -0.9 で上位に出ている",
                                decision: "現場は意思決定が速いと感じているのに、KPIが低い部署ほどそう答えている → 現場の判断ではなく、承認プロセスや経営判断のボトルネックを疑う。制度・権限委譲の見直しを検討。",
                                icon: "🔍",
                                color: "bg-rose-50 border-rose-100",
                            },
                            {
                                situation: "「目標への集中」が +0.8 で1位に出ている",
                                decision: "目標が明確な部署ほどKPIが高い傾向が明確。全社で目標設定の質を揃える施策（OKR導入・1on1での目標確認）が最もROIの高い打ち手。",
                                icon: "🎯",
                                color: "bg-teal-50 border-teal-100",
                            },
                            {
                                situation: "上位がすべて負の相関（-）で埋まっている",
                                decision: "組織全体として「頑張っているのに成果が出ない」状態。個人の努力ではなく構造的な問題（目標設定の不整合・人員過多または過少・外部要因）を経営レベルで検討する必要がある。",
                                icon: "⚠️",
                                color: "bg-amber-50 border-amber-100",
                            },
                            {
                                situation: "先月と今月で順位が大きく変わった設問がある",
                                decision: "1ヶ月で相関が変動した場合、施策の効果か異変の兆候かどちらかです。その設問と同時期に実施した施策・組織変更・人事異動と照らし合わせて原因を特定してください。",
                                icon: "📊",
                                color: "bg-blue-50 border-blue-100",
                            },
                        ].map((item, i) => (
                            <div key={i} className={`rounded-xl border px-5 py-4 ${item.color}`}>
                                <p className="text-sm font-black text-slate-700 mb-2 flex items-center gap-2">
                                    <span>{item.icon}</span>
                                    {item.situation}
                                </p>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6">
                                    → {item.decision}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-slate-400 font-medium px-1">
                    ※ 部署数が少ない（3部署未満）場合、相関係数は統計的に不安定になるため参考値として扱ってください。
                </p>
            </section>

            {/* Section ③ 人件費分析 */}
            <section className="space-y-4">
                <h2 id="labor-cost" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-indigo-500" />
                    人件費分析
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    部署ごとの人件費・一人当たり人件費・KPI達成率を横断的に比較できます。ダッシュボードの「人件費分析」セクション（サイドバーの「人事戦略 &gt; 人件費分析」）から確認できます。
                </p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    人件費データは KPI設定画面から「第2軸」として登録します。詳細は
                    <Link href="/docs/kpi-setup" className="text-teal font-bold hover:underline ml-1">KPIの設定と入力</Link>
                    を参照してください。
                </p>
            </section>

            {/* Section ④ AI 人事戦略提言 */}
            <section className="space-y-4">
                <h2 id="ai-insight" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Brain className="w-7 h-7 text-violet-500" />
                    AI 人事戦略提言
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    月次AI分析の実行時に、通常のAIインサイトとは別に人事戦略専用の提言が自動生成されます。リスクアラート・KPI達成状況・部署体温などを総合的に判断し、具体的なアクション提案を提示します。
                </p>
                <div className="rounded-2xl bg-violet-50 border border-violet-100 px-6 py-5">
                    <p className="text-sm text-violet-700 font-medium leading-relaxed">
                        <strong>生成タイミング：</strong>設定 → AI分析タブ から「最新の分析を生成する」を実行したとき。通常の月次AI分析と同時に生成されるため、追加の操作は不要です。
                    </p>
                </div>
            </section>
        </div>
    );
}
