import Link from "next/link";
import { ArrowRight, Table2, Lock, Unlock, Save, Layers, Info } from "lucide-react";

/**
 * KPI実績の入力方法ガイド
 * 管理者が毎月行うKPI実績入力画面の操作方法を解説
 */
export default function KpiInputPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">KPI Input Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    KPI実績の入力方法
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    毎月のKPI実績と目標値を一括入力する画面の使い方を解説します。設定画面での「KPI定義」とは異なり、ここでは実際の数値を記録します。
                </p>
            </div>

            {/* 設定と入力の違い */}
            <section className="space-y-6">
                <h2 id="setup-vs-input" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Info className="w-7 h-7 text-teal" />
                    「KPI設定」と「KPI入力」の違い
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <span className="text-lg">⚙️</span>
                            </div>
                            <h3 className="text-sm font-black text-slate-800">KPI設定（設定画面）</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            <strong>指標の定義</strong>を行う場所。KPIの名前・単位・担当部署を登録します。
                        </p>
                        <div className="text-xs text-slate-400 font-bold">
                            アクセス: 設定 → KPIタブ
                        </div>
                    </div>
                    <div className="p-6 bg-teal-50/50 border-2 border-teal-100/50 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                            <h3 className="text-sm font-black text-teal-800">KPI一括入力（本ページ）</h3>
                        </div>
                        <p className="text-xs text-teal-700 font-medium leading-relaxed">
                            <strong>毎月の実績値と目標値</strong>を入力する場所。定義済みのKPIに対して数値を記録します。
                        </p>
                        <div className="text-xs text-teal-600 font-bold">
                            アクセス: ダッシュボードヘッダーのメニュー → KPI入力
                        </div>
                    </div>
                </div>
            </section>

            {/* 画面構成 */}
            <section className="space-y-6">
                <h2 id="screen-layout" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Table2 className="w-7 h-7 text-teal" />
                    画面の構成
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    KPI入力画面は、横スクロール可能な<strong>スプレッドシート形式</strong>のテーブルで構成されています。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
                    <div className="space-y-3">
                        <h3 id="table-structure" className="text-base font-black text-slate-800">テーブルの見方</h3>
                        <ul className="text-sm text-slate-600 font-medium space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-teal font-black shrink-0">左列</span>
                                <span>— KPI名と担当部署が固定表示されます</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-black shrink-0">今月度列</span>
                                <span>— 緑色の背景で強調表示。ここに今月の実績と目標を入力します</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-500 font-black shrink-0">過去列</span>
                                <span>— 直近12ヶ月分の履歴を左スクロールで確認可能</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-500 font-black shrink-0">各セル</span>
                                <span>— 上段が「実績」、下段が「目標」の2段構成</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* デモ */}
            <section className="space-y-4">
                <a
                    href="/demo/kpi-input.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-100 rounded-[28px] shadow-sm hover:shadow-lg hover:border-teal-200 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                <span className="text-white text-xl">🧪</span>
                            </div>
                            <div>
                                <div className="text-base font-black text-slate-800 group-hover:text-teal transition-colors">
                                    インタラクティブデモを開く
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    実際のKPI入力画面を体験できます。入力・ロック切替・保存など自由にお試しください。
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-teal group-hover:translate-x-1 transition-transform" />
                    </div>
                </a>
            </section>

            {/* 入力の手順 */}
            <section className="space-y-6">
                <h2 id="input-steps" className="text-2xl font-black text-slate-900">入力の手順</h2>
                <div className="space-y-5">
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">1</div>
                        <div className="space-y-2 w-full">
                            <h3 id="input-step1" className="text-lg font-black text-slate-800">今月度の列（緑色）に実績値を入力</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                各KPIの今月度セルの<strong>「実績」欄</strong>に今月の数値を入力します。目標値が前月と同じ場合は変更不要です。
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">2</div>
                        <div className="space-y-2 w-full">
                            <h3 id="input-step2" className="text-lg font-black text-slate-800">必要に応じて目標値を更新</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                今月度の<strong>「目標」欄</strong>に数値を入力します。目標値は達成率の算出に使用されます。
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">3</div>
                        <div className="space-y-2 w-full">
                            <h3 id="input-step3" className="text-lg font-black text-slate-800">「この内容で保存する」ボタンをクリック</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                画面右上の保存ボタンで全データが一括保存されます。保存が完了するとボタンが緑色の「保存しました」に変化します。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ロック・アンロック */}
            <section className="space-y-6">
                <h2 id="lock-unlock" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Lock className="w-7 h-7 text-teal" />
                    過去実績の編集（ロック/アンロック）
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    デフォルトでは<strong>今月度の列のみ</strong>が入力可能で、過去月は読み取り専用（ロック状態）です。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-black text-slate-800">ロック状態（デフォルト）</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">今月度のみ入力可能。過去月は表示のみ。誤った過去データの上書きを防止します。</p>
                    </div>
                    <div className="p-5 bg-teal-50/50 border border-teal-100/50 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-teal" />
                            <span className="text-sm font-black text-teal-800">アンロック状態</span>
                        </div>
                        <p className="text-xs text-teal-700 font-medium">テーブル右上のロックアイコンをクリックすると、過去月の数値も編集可能になります。</p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-xs font-bold text-amber-800">
                    ⚠️ 過去実績を編集すると、ダッシュボードのKPI推移グラフやマトリックスの過去時点データにも反映されます。意図しない変更にご注意ください。
                </div>
            </section>

            {/* 第2軸入力 */}
            <section className="space-y-6">
                <h2 id="secondary-axis" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Layers className="w-7 h-7 text-teal" />
                    担当領域（第2軸）別の入力
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    設定画面で「担当領域」（地域・プロダクト等）を登録している場合、全社テーブルの下に<strong>領域ごとの個別テーブル</strong>が表示されます。
                </p>
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-3">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        各領域テーブルでは、同じKPI定義に対して<strong>領域別の個別数値</strong>を入力できます。例えば「月次売上」のKPIに対し、「東京本店: 500万、大阪支店: 300万」のように分けて入力します。
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                        ※ 第2軸のデータは、マトリックスの「担当領域」ビューに反映されます。
                    </p>
                </div>
            </section>

            {/* 入力のベストプラクティス */}
            <section className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 space-y-5">
                    <h2 id="best-practices" className="text-xl font-black flex items-center gap-2">
                        <Save className="w-6 h-6 text-teal-400" />
                        入力のベストプラクティス
                    </h2>
                    <ul className="space-y-3 text-sm font-medium text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">📅</span>
                            <span>毎月月初（1日〜5日）に前月分の実績をまとめて入力</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">🎯</span>
                            <span>目標値は四半期の始めにまとめて設定し、月ごとの微調整のみ行う</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">📊</span>
                            <span>ボイスチェックの回答が集まった後にKPIを入力すると、ダッシュボードで体温×KPIの相関が確認可能</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">💾</span>
                            <span>入力途中でも保存可能。こまめな保存がおすすめです</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Navigation */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/voice-check" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    ボイスチェック回答ガイド
                </Link>
                <Link href="/docs/dashboard-guide" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    ダッシュボードの見方
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
