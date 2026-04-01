"use client";

import { 
    HelpCircle, 
    Building2, 
    Users, 
    CreditCard, 
    ShieldAlert, 
    Settings, 
    ArrowRight, 
    Info, 
    Smartphone,
    Monitor,
    Zap,
    Globe,
    Brain,
    Bell,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    Lock
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function AdminHelpPage() {
    const mainSections = [
        {
            title: "契約企業管理 (Companies)",
            icon: Building2,
            color: "text-blue-500",
            bg: "bg-blue-50",
            description: "契約企業のライフサイクル全体を管理します。",
            items: [
                {
                    label: "新規企業の登録",
                    content: "企業の基本情報（社名、ドメイン、担当者）を登録し、テナント専用の隔離されたデータ領域を作成します。"
                },
                {
                    label: "代理ログイン (Impersonation)",
                    content: "管理画面の企業詳細から、特定の企業の一般ユーザー権限で擬似的にログインできます。不具合の調査や導入支援に活用してください。"
                }
            ]
        },
        {
            title: "管理者アカウント (Users)",
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-50",
            description: "SignsAI プラットフォームを操作するスーパー管理者を管理します。",
            items: [
                {
                    label: "権限レベル",
                    content: "現在、すべての管理者アカウントは「Super Admin」としてフルアクセス権限を持ちます。"
                }
            ]
        }
    ];

    const settingsTabs = [
        {
            id: "system",
            label: "1. システム制御",
            icon: Globe,
            title: "サービスの稼働と経済条件の管理",
            desc: "サービスの生死や、MRR計算の基礎となる料金設定を行います。",
            details: [
                {
                    name: "メンテナンスモード",
                    effect: "全ユーザー（管理者含む）のアクセスを遮断し、メンテナンス画面を表示します。ONにする際は慎重に行ってください。",
                    tip: "緊急のDBメンテナンスや、大規模アップデート時に使用します。"
                },
                {
                    name: "新規登録の受付",
                    effect: "LP（ランディングページ）等からの一般ユーザーの新規セルフ登録を許可するか制御します。",
                    tip: "クローズドベータ期間中などはOFFにして、管理画面からのみ登録するようにします。"
                },
                {
                    name: "プラン別料金テーブル",
                    effect: "Free / Team / Standard / Pro の各単価を設定します。ここでの値がダッシュボードのMRR（月次収益）集計や、企業への請求額計算のデフォルトになります。",
                    tip: "途中で変更しても、既存契約には影響せず、次回契約更新時から適用される設計を推奨します。"
                }
            ]
        },
        {
            id: "ai",
            label: "2. AIコントロール",
            icon: Brain,
            title: "知能エンジンのチューニング",
            desc: "SignsAI の核となる AI 分析の精度とコストを制御します。",
            details: [
                {
                    name: "ベースシステムプロンプト",
                    effect: "全社共通の「AIとしての振る舞い」を定義します。専門用語の解釈や、回答のトーン（敬語など）をここで統一します。",
                    tip: "「経営コンサルタントとして振る舞う」といった指示が基本です。"
                },
                {
                    name: "スロット別プロンプト",
                    effect: "「ダッシュボード要約」「アクション提案」など、場所ごとに個別のプロンプトを設定できます。特定の場所だけ回答が不自然な場合に調整します。",
                    tip: "ディープレポートなどは、より詳細な指示（4000文字程度）を与えることで精度が向上します。"
                },
                {
                    name: "AIモデル選択",
                    effect: "Claude 3.7 (最新・最高精度) / 3.5 Haiku (高速・低コスト) などを選択できます。通常は 3.7 Sonnet が推奨されます。",
                    tip: "コストを抑えたいテキスト抽出などは Haiku、深い洞察が必要なレポートは Sonnet と使い分けることができます。"
                }
            ]
        },
        {
            id: "alert",
            label: "3. 通知・監視",
            icon: Bell,
            title: "リスク検知とアラート",
            desc: "解約予兆のキャッチアップと、運営チームへの通知を最適化します。",
            details: [
                {
                    name: "解約リスク検知基準",
                    effect: "「ログインが◯日途絶えた」「KPIが◯ヶ月入力されていない」といった条件を設定。この条件に合致するとダッシュボードでアラート表示されます。",
                    tip: "SignsAI では「30日間ログインなし」を中リスク、「60日間」を高リスクと定義するのが一般的です。"
                },
                {
                    name: "Slack ウェブフック",
                    effect: "新規会員登録、企業の経営方針変更、エラー発生時などに通知を飛ばす先のURLを設定します。",
                    tip: "運営チームのチャンネルに連携することで、リアルタイムなフォローが可能になります。"
                }
            ]
        },
        {
            id: "survey",
            label: "4. ボイスチェック",
            icon: ClipboardList,
            title: "社員の声（サーベイ）の設定",
            desc: "社員の本音を引き出すためのバリデーションなどを管理します。",
            details: [
                {
                    name: "最低文字数制限",
                    effect: "社員アンケートの自由記述回答において、設定した文字数以下の場合は投稿できないようにします。内容の薄い回答を防ぎます。",
                    tip: "「20文字以上」に設定することで、AI分析に耐えうる具体的なフィードバックを促すことができます。"
                }
            ]
        }
    ];

    return (
        <main className="p-8 space-y-12 animate-fadeIn max-w-7xl mx-auto pb-32">
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl shadow-lg">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">操作マニュアル</h1>
                    <Badge className="bg-teal text-white border-none font-bold px-3 py-1">SUPER ADMIN</Badge>
                </div>
                <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                    SignsAI プラットフォームを安全・効果的に運営するための管理ガイドです。<br />
                    各機能の役割と、設定時のベストプラクティスを確認してください。
                </p>
            </header>

            {/* Basic Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mainSections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", section.bg, section.color)}>
                                <section.icon className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">{section.title}</h2>
                        </div>
                        <div className="space-y-3">
                            {section.items.map((item, i) => (
                                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <h3 className="text-sm font-black text-slate-700">{item.label}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Settings Guide */}
            <section className="space-y-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-slate-400" />
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">「システム設定」の詳細解説</h2>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">4つの設定タブごとに詳細な機能と注意事項をまとめています。</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {settingsTabs.map((tab) => (
                        <div key={tab.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-700 ring-1 ring-slate-100">
                                        <tab.icon className="w-6 h-6 outline-none" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tab.label}</div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{tab.title}</h3>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{tab.desc}</p>
                            </div>
                            
                            <div className="p-8 space-y-8 flex-1">
                                {tab.details.map((detail, idx) => (
                                    <div key={idx} className="relative pl-10 group">
                                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:text-teal group-hover:border-teal/30 transition-all">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                {detail.name}
                                                {detail.name.includes("メンテナンス") && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {detail.effect}
                                            </p>
                                            <div className="flex items-start gap-2 pt-1">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0 text-[10px] font-black mt-0.5 shrink-0">PRO TIP</Badge>
                                                <p className="text-[11px] font-bold text-slate-400 italic leading-relaxed">
                                                    {detail.tip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Pro Tip */}
            <section className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Zap className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/20 text-teal rounded-full text-[10px] font-black uppercase tracking-widest border border-teal/20">
                            Impersonation Guide
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter leading-[1.1]">
                            顧客と同じ視点で<br />
                            問題を解決する
                        </h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            「代理ログイン」は、不具合調査やCS対応に不可欠な機能です。<br />
                            顧客の現在の環境を自分の画面で再現し、言葉の壁を超えた迅速なサポートを実現します。
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center gap-5 group hover:bg-white/10 transition-all cursor-default">
                            <div className="w-12 h-12 rounded-2xl bg-teal/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-teal" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black mb-1">操作ログの透過性</h4>
                                <p className="text-xs text-slate-500 font-medium">すべての代理ログイン操作はシステムログに記録されます。</p>
                            </div>
                        </div>
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center gap-5 group hover:bg-white/10 transition-all cursor-default">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-rose-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black mb-1">個人情報の保護</h4>
                                <p className="text-xs text-slate-500 font-medium">不要な情報の閲覧は行わず、目的外の操作は厳に慎んでください。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <p>© 2024 SignsAI Admin Portal Master Guide</p>
                <div className="flex items-center gap-8">
                    <a href="#" className="hover:text-slate-600 transition-colors">利用規約</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">セキュリティポリシー</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">システム稼働状況</a>
                </div>
            </footer>
        </main>
    );
}
