import Link from "next/link";
import { ArrowRight, Rocket, Building2, Users, Target, FileText, Sparkles, CheckCircle2, UserPlus } from "lucide-react";

/**
 * 初回セットアップガイド
 * オンボーディングウィザードの全体フローを解説するドキュメントページ
 */
export default function GettingStartedPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Getting Started</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    初回セットアップガイド
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    アカウント作成後のオンボーディングウィザードの全体フローと、組織の「新規作成」と「招待で参加」の違いを解説します。
                </p>
            </div>

            {/* 2つの開始方法 */}
            <section className="space-y-6">
                <h2 id="start-options" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Rocket className="w-7 h-7 text-teal" />
                    2つの始め方
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Signs AI に初めてログインすると、<strong>オンボーディングウィザード</strong>が表示されます。ここで、以下の2つのモードから始め方を選択します。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-teal-500" />
                            </div>
                            <h3 id="create-new" className="text-lg font-black text-slate-900">🏢 新規作成</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            あなたが組織の<strong>最初の管理者</strong>となり、企業情報・部署・KPI・組織方針をゼロから設定します。
                        </p>
                        <div className="bg-teal/5 border border-teal/10 rounded-xl px-4 py-3 text-xs font-bold text-teal-800">
                            💡 経営企画・人事担当者・組織の責任者が選択するモードです
                        </div>
                    </div>
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 id="join-existing" className="text-lg font-black text-slate-900">🤝 招待で参加</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            管理者から受け取った<strong>招待トークン（コード）</strong>を入力し、既存の組織に参加します。所属部署と担当領域を選ぶだけで完了します。
                        </p>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs font-bold text-indigo-800">
                            💡 招待メールや Slack で共有されたリンクからアクセスすると自動で選択されます
                        </div>
                    </div>
                </div>
            </section>

            {/* 新規作成フロー */}
            <section className="space-y-6">
                <h2 id="create-flow" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Sparkles className="w-7 h-7 text-teal" />
                    新規作成のステップ（管理者向け）
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    4つのステップで組織の基盤を構築します。各ステップは<strong>後から設定画面でいつでも変更可能</strong>なので、まずは大まかに入力して進めてください。
                </p>

                <div className="space-y-5">
                    {/* Step 1 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">1</div>
                        <div className="space-y-3 w-full">
                            <h3 id="step-company" className="text-lg font-black text-slate-800">企業情報の入力</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                <strong>企業名</strong>と<strong>WebサイトURL（任意）</strong>を入力します。WebサイトURLは、AIが事業内容を把握する参考情報として利用します。
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">2</div>
                        <div className="space-y-3 w-full">
                            <h3 id="step-departments" className="text-lg font-black text-slate-800">部署の登録</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                組織内の部署（営業部、開発部、マーケティング部など）を登録します。ここで登録した部署が、マトリックスや体温分析の単位となります。
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold text-amber-800">
                                💡 最低1つの部署を登録してください。部署名は後から変更・追加できます。
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">3</div>
                        <div className="space-y-3 w-full">
                            <h3 id="step-kpi" className="text-lg font-black text-slate-800">KPIの設定</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                追跡したい主要指標（売上高、リード数、契約件数など）を定義します。各KPIには<strong>指標名</strong>、<strong>単位</strong>、<strong>月次目標値</strong>、<strong>担当部署</strong>を設定できます。
                            </p>
                            <Link href="/docs/kpi-setup" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-teal-600 transition-colors">
                                KPIの設定と入力について詳しく <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl font-black border border-slate-200">4</div>
                        <div className="space-y-3 w-full">
                            <h3 id="step-policy" className="text-lg font-black text-slate-800">組織方針の入力（スキップ可能）</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                AIが組織の状態を診断する際の判断基準となる「組織方針」を入力します。<strong>「質問に答える」モード</strong>を使えば、5つの質問に回答するだけでAI向けの方針文書が自動生成されます。
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                                ※ まだ方針が定まっていない場合は「スキップ」して後から登録することも可能です。
                            </p>
                            <Link href="/docs/policy-guide" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-teal-600 transition-colors">
                                組織方針について詳しく <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 招待参加フロー */}
            <section className="space-y-6">
                <h2 id="join-flow" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <UserPlus className="w-7 h-7 text-indigo" />
                    招待で参加するステップ（メンバー向け）
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    管理者から招待を受けた方は、以下の3ステップで参加できます。
                </p>
                <div className="space-y-4">
                    <div className="flex items-start gap-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
                        <div>
                            <h3 id="join-step1" className="text-sm font-black text-slate-800 mb-1">招待コードの入力 or リンクからアクセス</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                管理者からメールやSlackで共有された招待リンクをクリックするか、招待コードを手動で入力します。正しいコードを入力すると、参加先の組織名が表示されます。
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
                        <div>
                            <h3 id="join-step2" className="text-sm font-black text-slate-800 mb-1">所属部署の選択</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                管理者が事前に登録した部署一覧から、あなたの所属部署を選択します。招待時に部署が指定されている場合は、自動で選択された状態になっています。
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">3</div>
                        <div>
                            <h3 id="join-step3" className="text-sm font-black text-slate-800 mb-1">担当領域の選択（該当する場合）</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                組織で第2軸（地域・プロダクト等）が設定されている場合、担当する領域を選択します。設定されていない場合はこのステップは表示されません。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* セットアップ後のNext Steps */}
            <section className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 space-y-5">
                    <h2 id="next-steps" className="text-xl font-black flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-teal-400" />
                        セットアップ完了後にやること
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/docs/slack-integration" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                            <div className="text-xs font-black text-teal-400 uppercase tracking-widest mb-1">Step 1</div>
                            <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">Slack連携を設定する →</div>
                        </Link>
                        <Link href="/docs/member-management" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                            <div className="text-xs font-black text-teal-400 uppercase tracking-widest mb-1">Step 2</div>
                            <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">メンバーを招待する →</div>
                        </Link>
                        <Link href="/docs/voice-check" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                            <div className="text-xs font-black text-teal-400 uppercase tracking-widest mb-1">Step 3</div>
                            <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">ボイスチェックを実施する →</div>
                        </Link>
                        <Link href="/docs/kpi-input" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                            <div className="text-xs font-black text-teal-400 uppercase tracking-widest mb-1">Step 4</div>
                            <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">KPI実績を入力する →</div>
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
