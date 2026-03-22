import { 
    MessageSquare, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function SlackIntegrationPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Slack Integration</span>
            </nav>

            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Slackと連携する</h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    AIによる組織分析の結果を、使い慣れたSlackへ自動通知するための設定方法を解説します。
                </p>
            </div>

            <div className="p-6 bg-teal/5 border border-teal/10 rounded-3xl flex gap-4">
                <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                    <MessageSquare className="w-5 h-5 text-teal" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">連携のメリット</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        Signs AIにログインしなくても、組織の変化（予兆）や改善アクションのアドバイスをリアルタイムに受け取ることができます。
                    </p>
                </div>
            </div>

            {/* Step 1 */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">1</div>
                    <h2 className="text-2xl font-black text-slate-900">Slack Appを作成する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        まず、Signs AIからの通知を受け取るための「受け口」となるSlackアプリを自社で作成します。
                    </p>
                    <ul className="space-y-3 list-disc pl-5 text-slate-600 font-medium">
                        <li><Link href="https://api.slack.com/apps" target="_blank" className="text-teal hover:underline inline-flex items-center gap-1">Slack API: Your Apps <ExternalLink className="w-3 h-3" /></Link> にアクセス。「Create New App」をクリック。</li>
                        <li>「From scratch」を選択。</li>
                        <li>App Nameに「Signs AI」と入力し、通知先のワークスペースを選択して「Create App」をクリック。</li>
                    </ul>
                </div>
            </section>

            {/* Step 2 */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">2</div>
                    <h2 className="text-2xl font-black text-slate-900">Webhook URLを有効化する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Slackアプリが外部（Signs AI）からメッセージを受け取れるようにします。
                    </p>
                    <ul className="space-y-3 list-disc pl-5 text-slate-600 font-medium">
                        <li>左サイドバーの「Incoming Webhooks」を選択。</li>
                        <li>「Activate Incoming Webhooks」を <strong>On</strong> に切り替える。</li>
                        <li>下部の「Add New Webhook to Workspace」をクリック。</li>
                        <li>通知を送信したいチャンネルを選択して「Allow」をクリック。</li>
                        <li>生成された「Webhook URL」をコピーします。</li>
                    </ul>
                </div>
            </section>

            {/* Step 3 */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">3</div>
                    <h2 className="text-2xl font-black text-slate-900">Signs AIにURLを登録する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        コピーしたURLをSigns AIの設定画面に貼り付けます。
                    </p>
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-teal" />
                            <span className="text-sm font-black text-slate-800">登録手順</span>
                        </div>
                        <ol className="space-y-2 list-decimal pl-5 text-sm text-slate-600 font-medium">
                            <li>Signs AIのダッシュボードにログイン。</li>
                            <li>右下の「設定」アイコンをクリック。</li>
                            <li>「外部連携 / Slack」タブを開く。</li>
                            <li>「Webhook URL」欄にコピーしたURLをペーストし、「保存」をクリック。</li>
                            <li>「テスト送信」ボタンを押し、Slackに通知が届くか確認します。</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Hint / Warning section */}
            <div className="p-6 bg-amber-50 border border-amber-100/50 rounded-3xl flex gap-4">
                <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">注意点</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        Webhook URLは秘密鍵と同じです。外部に漏洩しないよう注意して管理してください。
                    </p>
                </div>
            </div>

            {/* Next buttons */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/introduction" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Signs AIとは？
                </Link>
                <Link href="/docs/member-management" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    メンバーの招待・管理
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
