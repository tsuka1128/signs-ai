import { 
    MessageSquare, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    ExternalLink,
    Slack,
    Settings,
    ShieldCheck,
    Terminal,
    Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SlackIntegrationPage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-slate-900">Slack Integration</span>
                </nav>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4A154B] text-white rounded-full text-xs font-bold tracking-tight mb-2">
                    <Slack className="w-3.5 h-3.5" />
                    External Integration
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    Slackアプリを準備する
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">
                    Signs AIからの通知をワークスペースで受け取るための、Incoming Webhookの設定手順を解説します。
                </p>
            </section>

            {/* Overview / Benefits */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[#4A154B]" />
                    </div>
                    <h3 className="font-black text-slate-800 tracking-tight">リアルタイムな兆兆の把握</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        ダッシュボードを開かなくても、組織の「温まり」や「冷え」の兆候をSlackでいち早く受け取れます。
                    </p>
                </div>
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="font-black text-slate-800 tracking-tight">AI提案の直接通知</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        各部署に最適化されたAIの改善アクション案が直接届き、即座に検討・実行に移せます。
                    </p>
                </div>
            </div>

            {/* Steps Section */}
            <div className="space-y-16 pt-8">
                {/* Step 1 */}
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 hidden md:block" />
                    <div className="space-y-8 relative">
                        <div className="flex items-center gap-6">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 z-10">1</div>
                            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Slack App の新規作成</h2>
                        </div>
                        
                        <div className="md:pl-14 grid lg:grid-cols-2 gap-10 items-start">
                            <div className="space-y-6">
                                <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                    まず、Slack公式のAPI管理画面から、自社専用の「Signs AI通知用アプリ」を作成します。
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span><Link href="https://api.slack.com/apps" target="_blank" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">Slack API: Your Apps <ExternalLink className="w-3 h-3" /></Link> へアクセス。</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span><strong>「Create New App」</strong>ボタンをクリック。</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span><strong>「From scratch」</strong>を選択し、App Nameに「Signs AI」と入力。</span>
                                    </li>
                                </ul>
                            </div>
                            
                            {/* Mock UI for Step 1 */}
                            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe className="w-3 h-3 text-slate-500" />
                                    <div className="text-[10px] text-slate-500 font-mono tracking-tighter">api.slack.com/apps</div>
                                </div>
                                <div className="bg-slate-800/50 p-6 rounded-2xl space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-white font-black text-lg">Create an app</div>
                                        <div className="text-slate-500 text-xs">✕</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-default border-teal-500/50 ring-1 ring-teal-500/20">
                                        <div className="text-white text-sm font-bold mb-1">From scratch</div>
                                        <div className="text-slate-400 text-[10px]">Start building from a blank slate.</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl opacity-40">
                                        <div className="text-white text-sm font-bold mb-1">From an app manifest</div>
                                        <div className="text-slate-400 text-[10px]">Use a JSON or YAML manifest.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 hidden md:block" />
                    <div className="space-y-8 relative">
                        <div className="flex items-center gap-6">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 z-10">2</div>
                            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Webhook URL の有効化と追加</h2>
                        </div>
                        
                        <div className="md:pl-14 grid lg:grid-cols-2 gap-10 items-start">
                            <div className="space-y-6">
                                <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                    作成したアプリが外部からメッセージを受け取れるように設定し、通知先のチャンネルを選びます。
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span>左メニューの<strong>「Incoming Webhooks」</strong>を選択。</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span><strong>Activate</strong>を「On」に切り替え、ページ最下部の<strong>「Add New Webhook...」</strong>をクリック。</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-[14px] text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                        <span>送信先のチャンネル（例: #management）を選択して承認。</span>
                                    </li>
                                </ul>
                                <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-900">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-[13px] font-bold leading-relaxed">
                                        発行された Webhook URL は秘密の鍵です。外部に漏れないよう注意してください。
                                    </p>
                                </div>
                            </div>
                            
                            {/* Visual for Webhook creation */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                        <Settings className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="text-sm font-black text-slate-800 tracking-tight">Webhook Settings</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-700">Activate Incoming Webhooks</div>
                                        <div className="w-10 h-5 bg-teal-500 rounded-full relative">
                                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Webhook URL</div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-mono text-slate-400 truncate">
                                                https://hooks.slack.com/services/T000...
                                            </div>
                                            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-center">
                                                <Copy className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                    <div className="space-y-8 relative">
                        <div className="flex items-center gap-6">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 z-10">3</div>
                            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Signs AI への URL 登録</h2>
                        </div>
                        
                        <div className="md:pl-14 max-w-2xl space-y-8">
                            <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                コピーした URL を Signs AI の管理画面に登録し、連携を完了させます。
                            </p>
                            
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-10 shadow-sm space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-teal-500" />
                                        <h4 className="text-[17px] font-black text-slate-800">最終ステップ</h4>
                                    </div>
                                    <ol className="text-[14px] text-slate-600 space-y-4 font-medium">
                                        <li className="flex gap-3">
                                            <span className="font-black text-slate-300 italic">01.</span>
                                            <span>Signs AIにログインし、右上の<strong>「設定（Settings）」</strong>を開きます。</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-slate-300 italic">02.</span>
                                            <span><strong>「外部連携 / Slack」</strong>タブを選択します。</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-black text-slate-300 italic">03.</span>
                                            <span>Webhook URL欄に貼り付け、<strong>「保存」</strong>をクリック。</span>
                                        </li>
                                        <li className="flex gap-3 border-t border-slate-50 pt-4">
                                            <span className="font-black text-slate-300 italic">04.</span>
                                            <span className="text-teal-700 font-bold">「テスト送信」を行い、自分のSlackに通知が届くか確認してください。</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support section */}
            <div className="mt-20 p-10 bg-indigo-50 border border-indigo-100/50 rounded-[3rem] text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm text-indigo-700 font-black text-xs uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" /> Ready to Scale
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">設定はこれで完了です</h3>
                <p className="text-[15px] text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
                    Slackとの連携が完了しました。次はチームメンバーを招待し、各個人の通知用IDを設定しましょう。
                </p>
                <div className="pt-4">
                    <Link 
                        href="/docs/member-management" 
                        className="inline-flex items-center gap-2 text-indigo-600 font-black hover:gap-3 transition-all underline decoration-2 underline-offset-8"
                    >
                        メンバーの招待・管理へ進む
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
