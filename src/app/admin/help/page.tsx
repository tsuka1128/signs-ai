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
    Zap
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function AdminHelpPage() {
    const sections = [
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
                    label: "契約ステータスの更新",
                    content: "Active（稼働中）、Trial（試用中）、Suspended（一時停止）などの状態を切り替え、アクセス権限を制御します。"
                },
                {
                    label: "代理ログイン (Impersonation)",
                    content: "管理画面の企業詳細から、特定の企業の一般ユーザー権限で擬似的にログインできます。不具合の調査や導入支援に活用してください。※操作ログは記録されます。"
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
                },
                {
                    label: "セキュリティ",
                    content: "管理者アカウントのパスワードは、セキュリティポリシーに基づき定期的な変更を推奨します。"
                }
            ]
        },
        {
            title: "プラン・請求 (Billing)",
            icon: CreditCard,
            color: "text-amber-500",
            bg: "bg-amber-50",
            description: "サブスクリプションと収益状況を管理します。",
            items: [
                {
                    label: "プラン割り当て",
                    content: "Team / Standard / Pro などのプランを企業に紐付けます。プランによって利用可能なKPI数や分析機能が制限されます。"
                },
                {
                    label: "Stripe 連携",
                    content: "実際の決済状況をカードからワンクリックで確認できます（※外部Stripeダッシュボードへのリンク）。"
                }
            ]
        },
        {
            title: "アラート・設定 (Monitoring)",
            icon: ShieldAlert,
            color: "text-rose-500",
            bg: "bg-rose-50",
            description: "システム全体の健全性を監視し、グローバル設定を行います。",
            items: [
                {
                    label: "未更新アラート",
                    content: "一定期間（デフォルト30日間）KPIやサーベイの更新がない企業を自動検知し、フォローアップを促します。"
                },
                {
                    label: "システムメンテナンス",
                    content: "「設定」タブから、全ユーザー向けのメンテナンス告知を表示するフラグを操作できます。"
                }
            ]
        }
    ];

    return (
        <main className="p-8 space-y-10 animate-fadeIn">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">操作マニュアル</h1>
                    <Badge className="bg-slate-900 text-white border-none font-bold">FOR SUPER ADMIN</Badge>
                </div>
                <p className="text-slate-500 font-medium">SignsAI プラットフォーム管理のための総合ガイドです。</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${section.bg} ${section.color} flex items-center justify-center`}>
                                <section.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">{section.title}</h2>
                                <p className="text-xs text-slate-400 font-medium">{section.description}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {section.items.map((item, i) => (
                                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-slate-100 hover:bg-white transition-all">
                                    <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 mb-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        {item.label}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {item.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <section className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Zap className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/20 text-teal rounded-full text-[10px] font-black uppercase tracking-widest border border-teal/20">
                        Pro Tip
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter leading-tight">
                        代理ログイン機能を<br />
                        カスタマーサクセスに活かす
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        「企業のダッシュボードが見づらい」「KPIの数値が合わない」といった問い合わせを受けた際、代理ログイン機能を使うことで、管理者と同じ視点で画面を確認できます。
                        これにより、口頭での説明を介さずに迅速なトラブルシューティングが可能になります。
                    </p>
                    <div className="pt-4 flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">対象ページ</span>
                            <span className="text-xs font-bold">契約企業詳細ページ</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">利用上の注意</span>
                            <span className="text-xs font-bold">個人情報の閲覧は必要最小限に</span>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <p>© 2024 SignsAI Admin Portal Guide</p>
                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-slate-600 transition-colors">利用規約</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">プライバシーポリシー</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">システムステータス</a>
                </div>
            </footer>
        </main>
    );
}
