import { 
    BookOpen, 
    ArrowRight, 
    Sparkles, 
    Target, 
    Users, 
    Zap 
} from "lucide-react";
import Link from "next/link";

export default function IntroductionPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Introduction</span>
            </nav>

            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Signs AIとは？</h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    数値データ（KPI）と感情データ（ボイスチェック）を掛け合わせ、組織の「兆候」を見逃さないAIエンジンです。
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">解決したい課題</h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    多くの組織では、売上や利益などの「結果指標」が低下するまで、現場で起きている問題（離職、モチベーション低下、コミュニケーション不全）に気づくことができません。Signs AIは、組織の「体温」を計測することで、問題が表面化する前の「兆候（Signs）」を捉えることを目的としています。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <Target className="w-6 h-6 text-teal mb-3" />
                    <h3 className="text-lg font-black text-slate-900 mb-2">定量（KPI）</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        部署ごとの生産性、商談数、解約率などのKPIを追跡し、組織の成果を可視化します。
                    </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <Users className="w-6 h-6 text-teal mb-3" />
                    <h3 className="text-lg font-black text-slate-900 mb-2">定性（Voice）</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        独自の11の質問により、現場の「本音」や「ボトルネック」をスコア化します。
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                    AIができること
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    Signs AIのAIエンジンは、膨大なデータを以下のように要約・分析します：
                </p>
                <ul className="space-y-3 list-none pl-0">
                    {[
                        { title: "異常値の早期発見", desc: "前月比で急落したスコアや、KPIと連動していない動きを自動でアラート通知します。" },
                        { title: "因果仮説の構築", desc: "「なぜKPIが未達なのか？」を社員の声から分析し、構造的な原因を推測します。" },
                        { title: "改善アクションの提案", desc: "データに基づき、マネージャーが明日から取り組むべき具体的な指示を書き出します。" }
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                            <Sparkles className="w-5 h-5 text-teal mt-0.5" />
                            <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">{item.title}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Next buttons */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-end">
                <Link href="/docs/slack-integration" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    Slack連携の手順
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
