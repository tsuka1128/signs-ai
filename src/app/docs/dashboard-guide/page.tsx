import Link from "next/link";
import { ArrowRight, LayoutDashboard, BarChart3, Building2, Thermometer, ListTodo, FileText, Grid3X3, Brain, Sun, Cloud, CloudRain, Lightbulb } from "lucide-react";

/**
 * ダッシュボードの見方ガイド
 * メインダッシュボードの6つのセクションの読み方を解説
 */
export default function DashboardGuidePage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Dashboard Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    ダッシュボードの見方
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    ログイン後に表示されるダッシュボード画面の各セクションの意味と読み方を解説します。
                </p>
            </div>

            {/* 全体構成 */}
            <section className="space-y-6">
                <h2 id="overview" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <LayoutDashboard className="w-7 h-7 text-teal" />
                    ダッシュボードの全体構成
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    ダッシュボードは、上部の<strong>AIインサイトカード</strong>と<strong>部署タブ</strong>、そして下部の<strong>6つのセクションタブ</strong>で構成されています。部署タブで特定部署を選択すると、すべてのセクションがその部署に絞り込まれた表示に切り替わります。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { icon: Grid3X3, label: "マトリックス", color: "bg-teal-50 text-teal-700 border-teal-100" },
                        { icon: BarChart3, label: "KPI推移", color: "bg-blue-50 text-blue-700 border-blue-100" },
                        { icon: Building2, label: "組織サマリー", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                        { icon: Thermometer, label: "組織の体温", color: "bg-amber-50 text-amber-700 border-amber-100" },
                        { icon: ListTodo, label: "アクション", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                        { icon: FileText, label: "組織方針", color: "bg-purple-50 text-purple-700 border-purple-100" },
                    ].map((item, i) => (
                        <div key={i} className={`px-4 py-3 rounded-2xl border text-sm font-bold text-center ${item.color}`}>
                            {item.label}
                        </div>
                    ))}
                </div>
            </section>

            {/* AIインサイトカード */}
            <section className="space-y-6">
                <h2 id="ai-insight" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Brain className="w-7 h-7 text-teal" />
                    AIインサイトカード
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    ダッシュボード最上部に表示されるカードです。AIが組織全体（または選択した部署）の状態を要約した診断テキストを表示します。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
                    <div className="space-y-3">
                        <h3 id="deep-report" className="text-base font-black text-slate-800">Deep Report（深層レポート）</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            全社タブ選択時に表示される「詳細分析を見る」ボタンをタップすると、経営向けの<strong>5つの観点からの分析レポート</strong>がフルスクリーンで展開されます。
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">レポートの構成</div>
                            <ul className="text-xs text-slate-600 font-medium space-y-1">
                                <li>1. <strong>総評</strong> — 組織の健全性と戦略進捗の概要</li>
                                <li>2. <strong>KPIとの相関解析</strong> — 体温×KPIの4象限分析</li>
                                <li>3. <strong>方針との整合性チェック</strong> — 現場と方針のギャップ</li>
                                <li>4. <strong>中長期リスクと成長機会</strong> — 予測と機会</li>
                                <li>5. <strong>具体的提言</strong> — 経営層が打つべき次の一手</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* マトリックスセクション */}
            <section className="space-y-6">
                <h2 id="matrix-section" className="text-2xl font-black text-slate-900">マトリックスセクション</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    各部署・担当領域のポジションを4つの視点で同時に可視化する散布図です。<strong>X軸＝人数（所属リソース）</strong>、<strong>Y軸＝KPI達成率または一人当たり生産性（切替可能）</strong>、<strong>バブルの色＝組織体温</strong>（灰色は体温未取得＝回答者3名未満を含む）、<strong>バブルの大きさ＝KPI達成率</strong>（Proプランでは人件費）を表します。
                </p>
                <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl px-5 py-4 text-xs font-bold text-teal-800">
                    詳しい読み方は「<Link href="/docs/bubble-chart-guide" className="underline">マトリックスの見方</Link>」をご覧ください。「軌跡（動く地図）」で過去の変遷も確認できます（履歴が12ヶ月分に満たない間は表示されません）。
                </div>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-3">
                    <h3 id="matrix-switch" className="text-base font-black text-slate-800">表示の切り替え</h3>
                    <ul className="text-sm text-slate-600 font-medium space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-teal font-black">部署</span>
                            <span>— 部署単位でマトリックスを表示（デフォルト）</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal font-black">担当領域</span>
                            <span>— 第2軸（地域・プロダクト等）で表示を切り替え</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal font-black">時点</span>
                            <span>— 「最新」「1ヶ月前」「3ヶ月前」「6ヶ月前」「12ヶ月前」で比較可能（推移表は直近13ヶ月分）</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* KPI推移セクション */}
            <section className="space-y-6">
                <h2 id="kpi-trend" className="text-2xl font-black text-slate-900">KPI推移セクション</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    登録済みのKPIごとに、<strong>過去13ヶ月の実績推移</strong>と<strong>目標達成率</strong>をグラフで表示します。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
                    <h3 id="kpi-reading" className="text-base font-black text-slate-800">グラフの読み方</h3>
                    <ul className="text-sm text-slate-600 font-medium space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-black">実績ライン</span>
                            <span>— 毎月の実績値の推移を折れ線グラフで表示</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-slate-400 font-black">目標ライン</span>
                            <span>— 各月の目標値を破線で表示</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal font-black">達成率</span>
                            <span>— 最新月の「実績 ÷ 目標 × 100」で算出。100%以上が達成</span>
                        </li>
                    </ul>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600">
                        KPIの切り替えは、セクション上部のKPI名をタップすると他のKPIに切り替え可能です。
                    </div>
                </div>
            </section>

            {/* 組織サマリー */}
            <section className="space-y-6">
                <h2 id="org-kpi" className="text-2xl font-black text-slate-900">組織サマリーセクション</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    部署ごと（または担当領域ごと）の組織コンディションをカード形式で一覧表示します。各カードには以下の情報が含まれます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="text-sm font-black text-slate-800">体温スコア</div>
                        <p className="text-xs text-slate-600 font-medium">ボイスチェックの平均スコア（1〜5）。4.0以上で晴れ、3.0以上で曇り、3.0未満で雨のアイコン（天気メタファ）が表示されます。回答者が3名未満の場合は体温未取得（「集計中」「未計測」）となります。</p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="text-sm font-black text-slate-800">KPI達成率</div>
                        <p className="text-xs text-slate-600 font-medium">部署が担当する全KPIの達成率を平均化した値です。</p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="text-sm font-black text-slate-800">人員数</div>
                        <p className="text-xs text-slate-600 font-medium">「回答者数 / 所属人数」の形式で、回答率も把握できます。回答者が3名未満の場合、体温は非表示（「集計中」扱い）となり個人は特定されません。</p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="text-sm font-black text-slate-800">推移グラフ</div>
                        <p className="text-xs text-slate-600 font-medium">体温スコアの過去13ヶ月の推移を小さなスパークラインで表示。</p>
                    </div>
                </div>
            </section>

            {/* 組織の体温 */}
            <section className="space-y-6">
                <h2 id="org-temperature" className="text-2xl font-black text-slate-900">組織の体温セクション</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    ボイスチェックの各設問（標準11問＋カスタム最大3問）を、設問ごとのスコアとして表示します。<strong>前月との比較（↑↓）</strong>も確認でき、どの設問のスコアが改善・悪化しているかが一目で分かります。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-3">
                    <h3 id="score-meaning" className="text-base font-black text-slate-800">スコアの目安</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <Sun className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden />
                            <div>
                                <span className="text-sm font-black text-emerald-700">晴れ（4.0 以上）</span>
                                <span className="text-xs text-emerald-600 font-medium ml-2">良好 — 前向きなエネルギーが維持されている</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <Cloud className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
                            <div>
                                <span className="text-sm font-black text-amber-700">曇り（3.0 〜 3.9）</span>
                                <span className="text-xs text-amber-600 font-medium ml-2">注意 — 兆候を確認し、対策を検討すべき</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <CloudRain className="w-5 h-5 text-rose-500 shrink-0" aria-hidden />
                            <div>
                                <span className="text-sm font-black text-rose-700">雨（3.0 未満）</span>
                                <span className="text-xs text-rose-600 font-medium ml-2">低体温（要ケア） — 早急なアクションが必要</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* アクション・組織方針 */}
            <section className="space-y-6">
                <h2 id="action-policy" className="text-2xl font-black text-slate-900">アクション & 組織方針</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    これらのセクションの詳しい使い方は、専用のドキュメントをご覧ください。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/docs/action-guide" className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all group">
                        <div className="text-sm font-black text-slate-800 group-hover:text-teal transition-colors">アクション管理の使い方 →</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">AI提案の管理・ライフサイクル</p>
                    </Link>
                    <Link href="/docs/policy-guide" className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all group">
                        <div className="text-sm font-black text-slate-800 group-hover:text-teal transition-colors">組織方針の登録 →</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">セマンティックレイヤーの編集と履歴管理</p>
                    </Link>
                </div>
            </section>

            {/* 部署タブのフィルタリング */}
            <section className="space-y-6">
                <h2 id="dept-filter" className="text-2xl font-black text-slate-900">部署タブによる絞り込み</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    AIインサイトカードの下に表示される<strong>部署タブ</strong>（全社、営業部、マーケティング部 など）をタップすると、ダッシュボード全体がその部署のデータに絞り込まれます。
                </p>
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-5 py-4 text-xs font-bold text-indigo-800 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" aria-hidden />
                    各部署の具体的な診断テキストや「AI方針翻訳（全社方針がその部署にどう適用されるかの解説）」は、<strong>組織サマリー</strong>セクションの各部署カード下部にて確認できます。
                </div>
            </section>

        </div>
    );
}
