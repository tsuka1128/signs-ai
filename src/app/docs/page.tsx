import Link from "next/link";
import { 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    ChevronRight,
    Sparkles,
    Zap,
    Database,
    Brain,
    CheckCircle2,
    ArrowRight,
    Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils/index";

export default function DocsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/5 text-teal rounded-full text-[10px] font-black uppercase tracking-widest border border-teal/10">
                    <Sparkles className="w-3 h-3" />
                    Signs AI Help Center
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Signs AI ヘルプセンターへようこそ
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    Signs AIのセットアップから高度な分析の活用方法まで、知りたい情報をここで見つけることができます。
                </p>
            </div>
            
            {/* Solution Flow Section for Users */}
            <section className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Sparkles className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 space-y-10">
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-black tracking-tight">Signs AI が組織課題を解決する仕組み</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">How it Works</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {[
                            {
                                title: "1. 入力と蓄積",
                                desc: "月次のKPIと社員の本音を入力。客観的な数値と主観的な感情の両面を収集します。",
                                icon: Database,
                                color: "text-emerald-400"
                            },
                            {
                                title: "2. 多角的分析",
                                desc: "経営方針とデータを照合。AIが「今、どこで、何が起きているか」を深く洞察します。",
                                icon: Brain,
                                color: "text-amber-400"
                            },
                            {
                                title: "3. 改善の実行",
                                desc: "具体的なアクション提案に基づき施策を実行。組織を「あるべき姿」へ導きます。",
                                icon: CheckCircle2,
                                color: "text-teal-400"
                            }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center space-y-4 group">
                                <div className={cn("w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all shadow-inner", step.color)}>
                                    <step.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black">{step.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium px-4">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 flex justify-center">
                        <Link 
                            href="/docs/introduction"
                            className="bg-white text-slate-900 px-8 py-3 rounded-full font-black text-sm hover:bg-teal hover:text-white transition-all shadow-lg"
                        >
                            詳しく理解する
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link 
                    href="/docs/getting-started"
                    className="group p-6 bg-white border-2 border-teal/20 rounded-[32px] shadow-sm hover:shadow-xl hover:border-teal/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute top-4 right-4 px-2 py-0.5 bg-teal text-white text-[10px] font-black rounded-full tracking-wider animate-pulse">
                        START HERE
                    </div>
                    <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center mb-4 text-white">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">初回セットアップガイド</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        Signs AIを使い始めるための最短ルート。アカウント作成から組織情報の登録まで。
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal">
                        まずはここから <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link 
                    href="/docs/introduction"
                    className="group p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-teal/30 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-colors">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Signs AIとは？</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        サービスの概要と、組織の「兆候」をどのように可視化するのかを理解しましょう。
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal">
                        詳しく見る <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link 
                    href="/docs/slack-integration"
                    className="group p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-teal/30 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-colors">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Slack連携</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        AIによる分析結果をSlackに通知するための設定方法を分かりやすく解説します。
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal">
                        詳しく見る <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link 
                    href="/docs/kpi-setup"
                    className="group p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-teal/30 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-colors">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">KPI設定</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        組織の定量指標（KPI）を定義し、月次の実績を入力するフローを学習します。
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal">
                        詳しく見る <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Popular Topics section */}
            <div className="pt-8 border-t border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    人気のトピック
                </h2>
                <ul className="space-y-4">
                    {[
                        { title: "SlackとのWebhook連携がうまくいかない", href: "/docs/slack-integration" },
                        { title: "メンバーごとのメンションIDを確認する方法", href: "/docs/member-management" },
                        { title: "組織方針（Semantic Layer）をAIに正しく伝えるコツ", href: "/docs/policy-guide" },
                        { title: "部署別マトリックスでの分析の読み解き方", href: "/docs/bubble-chart-guide" }
                    ].map((topic, i) => (
                        <li key={i}>
                            <Link href={topic.href} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all font-bold text-sm text-slate-700">
                                {topic.title}
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
