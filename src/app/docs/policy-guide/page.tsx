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

            {/* Why it is important */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        AIによる「コンテキスト理解（Semantic Layer）」
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        単に「退職率が上がった」というデータに対しても、企業が置かれている状況によって取るべきアクションは180度異なります。
                    </p>
                    <ul className="space-y-2 mt-4">
                        <li><strong>状況A：</strong>「現在は大量採用フェーズで、多少の離職は許容してでも売上を急拡大させたい」</li>
                        <li><strong>状況B：</strong>「少数精鋭の組織づくりを目指しており、1人の離職も防ぎたい」</li>
                    </ul>
                    <p>
                        Signs AIにこの「前提（＝組織方針）」をインプットしておくことで、AIは単なる数字の増減だけでなく、**「その方針に対して、現在の部署の状況が適切かどうか」**という極めて高度でカスタマイズされた評価と提案を行うようになります。
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 bg-violet-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 relative z-10">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        登録すべき内容のベストプラクティス
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white border border-slate-200 p-4 rounded-xl">
                            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded inline-block mb-2">良い例（Good）</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                「今期は新規事業の立ち上げを最優先とし、短期的な利益率の低下は許容する。ただし、コアメンバーのバーンアウト（燃え尽き）には最大限の注意を払うこと。」
                            </p>
                            <span className="block mt-2 text-[11px] text-slate-400">→ 目標と制約（トレードオフ）が明確</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-xl">
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block mb-2">悪い例（Bad）</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                「売上を上げて、コストを下げて、みんなで仲良く頑張る。」
                            </p>
                            <span className="block mt-2 text-[11px] text-slate-400">→ 一般論すぎてAIが独自のアドバイスを作れない</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to set */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        登録・更新の方法
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm border border-slate-200">1</div>
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">画面上部の入力エリアへ</span>
                            <span className="text-sm text-slate-600 font-medium">ダッシュボード上部（またはナビゲーション）にある「組織方針」セクションを開きます。</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm border border-slate-200">2</div>
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">経営陣の「生の言葉」をそのまま入力</span>
                            <span className="text-sm text-slate-600 font-medium">箇条書きでも、文章でも構いません。期初のキックオフ資料のテキストをコピー＆ペーストする使い方が推奨されます。気になる「地雷キーワード（禁止用語など）」も設定可能です。</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm border border-slate-200">3</div>
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">定期的な見直しと更新</span>
                            <span className="text-sm text-slate-600 font-medium">四半期ごとなど、会社の目標やフェーズが変わるタイミングで更新してください。AIは常に「最新の組織方針」を正として全社データを読み解きます。</span>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 mt-6">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                        <strong>管理者権限のあるユーザーのみ</strong>が組織方針の登録・更新を行うことができます。ここで設定された内容は、次回のAI解析（毎月1日等）からすべての分析レポートとアクション提案に反映されます。
                    </p>
                </div>
            </section>
        </div>
    );
}
