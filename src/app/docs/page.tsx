import Link from "next/link";
import { 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    Users, 
    ChevronRight,
    Sparkles,
    Zap
} from "lucide-react";

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

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <Link 
                    href="/docs/member-management"
                    className="group p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-teal/30 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">メンバー管理</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        チームメンバーの招待、権限設定、Slack User IDの確認方法を説明します。
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
                        "SlackとのWebhook連携がうまくいかない",
                        "メンバーごとのメンションIDを確認する方法",
                        "組織方針（Semantic Layer）をAIに正しく伝えるコツ",
                        "部署別マトリックスでの分析の読み解き方"
                    ].map((topic, i) => (
                        <li key={i}>
                            <Link href="#" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all font-bold text-sm text-slate-700">
                                {topic}
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
