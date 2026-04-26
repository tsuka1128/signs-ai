import Link from "next/link";
import { ArrowRight, HelpCircle, AlertTriangle, RefreshCw, Shield, UserX, BarChart3, MessageSquare, Settings } from "lucide-react";

/**
 * FAQ / トラブルシューティング
 * よくある質問とその解決策をまとめたページ
 */
export default function FaqPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">FAQ</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    FAQ / トラブルシューティング
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    よくある質問と、困ったときの解決策をまとめています。
                </p>
            </div>

            {/* アカウント・ログイン */}
            <section className="space-y-6">
                <h2 id="account" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Shield className="w-7 h-7 text-teal" />
                    アカウント・ログイン
                </h2>
                <div className="space-y-4">
                    <FaqItem
                        id="faq-login-fail"
                        question="ログインできません"
                        answer="メールアドレスとパスワードが正しいか確認してください。パスワードを忘れた場合は、ログイン画面の「パスワードをお忘れですか？」からリセットが可能です。"
                    />
                    <FaqItem
                        id="faq-invitation-expired"
                        question="招待コードが無効と表示されます"
                        answer="招待コード（トークン）は一度使用すると無効になります。管理者に依頼して、新しい招待を発行してもらってください。また、コードの前後に余計なスペースが入っていないかも確認してください。"
                    />
                    <FaqItem
                        id="faq-change-dept"
                        question="所属部署を変更したい"
                        answer="管理者が設定画面の「メンバー」タブから変更できます。メンバーカードの編集ボタンをクリックし、新しい部署を選択してください。"
                    />
                </div>
            </section>

            {/* ボイスチェック */}
            <section className="space-y-6">
                <h2 id="voice-check-faq" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <MessageSquare className="w-7 h-7 text-teal" />
                    ボイスチェック（アンケート）
                </h2>
                <div className="space-y-4">
                    <FaqItem
                        id="faq-survey-url"
                        question="アンケートのURLが開けません"
                        answer="アンケート（ボイスチェック）はログイン不要で回答可能です。管理者から共有された専用のURLをクリックすれば、そのまま回答画面が開きます。もし開けない場合は、URLが途中で切れていないか、または企業のセキュリティ設定（プロキシ等）でブロックされていないか確認してください。"
                    />
                    <FaqItem
                        id="faq-survey-resubmit"
                        question="アンケートに再回答したい"
                        answer="同月内に再度回答したい場合は、完了画面の「リセット（再入力）」リンクをクリックしてください。ただし、以前の回答はデータベースに残った状態で、新しい回答が追加されます。"
                    />
                    <FaqItem
                        id="faq-survey-anonymous"
                        question="回答が個人に紐づけられることはありますか？"
                        answer="いいえ。回答は完全に匿名です。部署単位の平均スコアとしてのみ集計され、管理者も個人の回答内容を閲覧することはできません。"
                    />
                    <FaqItem
                        id="faq-survey-100chars"
                        question="自由記述の最低文字数に達しません"
                        answer="Step 3の「KPI改善に関する記述」は、AIが組織の課題を分析するための重要なインプットです。最低文字数は管理者が「設定 > ボイスチェック」から変更できます（デフォルト: 20文字）。具体的なエピソードや改善提案を含めると、自然と文字数を超えます。"
                    />
                </div>
            </section>

            {/* KPI・データ */}
            <section className="space-y-6">
                <h2 id="kpi-faq" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-teal" />
                    KPI・データ入力
                </h2>
                <div className="space-y-4">
                    <FaqItem
                        id="faq-kpi-not-reflected"
                        question="KPIを入力したのに、ダッシュボードに反映されません"
                        answer="保存ボタンをクリックし、「保存しました」と表示されたことを確認してください。保存後、ダッシュボードに戻ってページを更新すると反映されます。ブラウザのキャッシュが原因の場合もあるため、Ctrl+Shift+R（Mac: Cmd+Shift+R）でハードリロードをお試しください。"
                    />
                    <FaqItem
                        id="faq-kpi-past-edit"
                        question="過去月のKPI実績を修正したい"
                        answer="KPI入力画面のテーブル右上にあるロックアイコンをクリックすると、過去月の編集が有効になります。修正後は必ず保存してください。"
                    />
                    <FaqItem
                        id="faq-kpi-target"
                        question="目標値をまとめて設定できますか？"
                        answer="現在は各月ごとに個別入力する仕様です。過去実績を解除して全月分を一括入力し、保存することで対応可能です。"
                    />
                    <FaqItem
                        id="faq-matrix-not-shown"
                        question="マトリックスにバブルが表示されません"
                        answer="マトリックス表示には、各部署に人員数（設定画面で登録）と体温データ（ボイスチェック回答）が必要です。部署の所属人数が0の場合や、ボイスチェック回答がゼロ件の場合はバブルが表示されません。"
                    />
                </div>
            </section>

            {/* 設定・管理 */}
            <section className="space-y-6">
                <h2 id="settings-faq" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-teal" />
                    設定・管理
                </h2>
                <div className="space-y-4">
                    <FaqItem
                        id="faq-slack-test-fail"
                        question="Slack連携のテスト通知が届きません"
                        answer={`以下を確認してください：\n1. Webhook URLが正しく入力・保存されているか\n2. Slackアプリが対象チャンネルに追加されているか\n3. Slack側でIncoming Webhooksが「On」になっているか\n\n詳しくは「Slackアプリを準備する」のドキュメントをご覧ください。`}
                    />
                    <FaqItem
                        id="faq-delete-member"
                        question="メンバーを削除するとデータはどうなりますか？"
                        answer="メンバーを削除しても、過去のボイスチェック回答データは匿名のまま保持されます。削除されるのはそのメンバーのアカウント情報（名前・メールアドレス・Slack ID等）のみです。"
                    />
                    <FaqItem
                        id="faq-secondary-axis"
                        question="「担当領域」とは何ですか？"
                        answer="部署とは別の分析軸です。例えば「地域（東京・大阪・名古屋）」「プロダクト（SaaS A・SaaS B）」など、組織の実態に合わせた横串の分析が可能です。設定画面の「担当領域」タブから設定できます。"
                    />
                    <FaqItem
                        id="faq-signs-id"
                        question="Signs AI IDとは何ですか？"
                        answer="あなたの組織を一意に識別する短縮IDです。設定画面の「基本設定」タブに表示されます。今後のAPI連携やサポート問い合わせ時に使用する場合があります。"
                    />
                </div>
            </section>

            {/* お問い合わせ */}
            <section className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 space-y-4">
                    <h2 id="contact" className="text-xl font-black flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-teal-400" />
                        解決しない場合
                    </h2>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                        上記で解決しない問題が発生した場合は、以下の情報を添えてサポートまでお問い合わせください。
                    </p>
                    <ul className="space-y-2 text-sm font-medium text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">1.</span>
                            Signs AI ID（設定 → 基本設定に表示）
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">2.</span>
                            問題が発生した画面のスクリーンショット
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">3.</span>
                            問題が発生した日時
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">4.</span>
                            利用環境（ブラウザ名・OS）
                        </li>
                    </ul>
                </div>
            </section>

        </div>
    );
}

/**
 * FAQアイテムコンポーネント
 * アコーディオン風のQ&A表示
 */
function FaqItem({ id, question, answer }: { id: string; question: string; answer: string }) {
    return (
        <details id={id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <summary className="flex items-start gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="w-7 h-7 shrink-0 bg-teal-50 text-teal rounded-lg flex items-center justify-center mt-0.5 group-open:bg-teal group-open:text-white transition-colors">
                    <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-teal transition-colors">{question}</h3>
                </div>
                <div className="w-6 h-6 shrink-0 flex items-center justify-center text-slate-300 group-open:rotate-45 transition-transform">
                    <span className="text-xl font-bold">+</span>
                </div>
            </summary>
            <div className="px-16 pb-5 text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                {answer}
            </div>
        </details>
    );
}
