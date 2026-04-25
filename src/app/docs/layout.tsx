"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    Users, 
    ChevronRight, 
    ArrowLeft,
    Home,
    HelpCircle,
    Target,
    CheckSquare,
    Rocket,
    MessageSquareHeart,
    Table2,
    LayoutDashboard,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * ドキュメントサイドメニュー定義
 * ユーザーの利用順序に沿ったカテゴリ分け:
 * 1. はじめに — 概要 → 初回セットアップ
 * 2. 設定と連携 — KPI定義 → 方針 → Slack → メンバー
 * 3. 日常の運用 — ボイスチェック → KPI入力 → ダッシュボード
 * 4. 分析と改善 — PDCA → アクション → マトリックス → 成長の軌跡
 * 5. サポート — FAQ
 */
const DOCS_MENU = [
    {
        title: "はじめに",
        items: [
            { title: "Signs AIとは？", href: "/docs/introduction", icon: BookOpen },
            { title: "初回セットアップガイド", href: "/docs/getting-started", icon: Rocket },
        ]
    },
    {
        title: "設定と連携",
        items: [
            { title: "KPIの設定と入力", href: "/docs/kpi-setup", icon: BarChart3 },
            { title: "組織方針の登録", href: "/docs/policy-guide", icon: Target },
            { title: "Slackアプリを準備する", href: "/docs/slack-integration", icon: MessageSquare },
            { title: "メンバーの招待・管理", href: "/docs/member-management", icon: Users },
        ]
    },
    {
        title: "日常の運用",
        items: [
            { title: "ボイスチェック回答ガイド", href: "/docs/voice-check", icon: MessageSquareHeart },
            { title: "KPI実績の入力方法", href: "/docs/kpi-input", icon: Table2 },
            { title: "ダッシュボードの見方", href: "/docs/dashboard-guide", icon: LayoutDashboard },
        ]
    },
    {
        title: "分析と改善",
        items: [
            { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: Target },
            { title: "アクション管理の使い方", href: "/docs/action-guide", icon: CheckSquare },
            { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: BarChart3 },
            { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: TrendingUp },
        ]
    },
    {
        title: "サポート",
        items: [
            { title: "FAQ / トラブルシューティング", href: "/docs/faq", icon: HelpCircle },
        ]
    }
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Secondary Sidebar Content for Docs - Not using separate header */}
                <div className="hidden md:block lg:sticky lg:top-8 h-fit">
                {/* Sidebar Navigation */}
                <aside className="w-60 border-r border-slate-100 hidden md:block pt-0 pb-12 overflow-y-auto">
                    <div className="px-6 space-y-8">
                        <div>
                            <Link 
                                href="/docs" 
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all",
                                    pathname === "/docs" ? "bg-teal/5 text-teal" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Home className="w-4 h-4" />
                                ドキュメントトップ
                            </Link>
                        </div>

                        {DOCS_MENU.map((group, i) => (
                            <div key={i} className="space-y-2">
                                <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">
                                    {group.title}
                                </h3>
                                <nav className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all group",
                                                    isActive 
                                                        ? "bg-teal/5 text-teal shadow-sm ring-1 ring-teal/10" 
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <item.icon className={cn("w-4 h-4", isActive ? "text-teal" : "text-slate-400 group-hover:text-slate-600")} />
                                                    {item.title}
                                                </div>
                                                {isActive && <ChevronRight className="w-3 h-3 text-teal" />}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}

                        <div className="pt-8 mt-8 border-t border-slate-50">
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <HelpCircle className="w-4 h-4 text-teal" />
                                    <span className="text-xs font-bold text-slate-800">お困りですか？</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                                    解決しない場合は、サポートチームまでお気軽にお問い合わせください。
                                </p>
                                <button className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-teal/30 hover:text-teal transition-all">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="p-6 md:p-12 max-w-3xl mx-auto">
                        {children}



                        {/* Pagination Navigation */}
                        {pathname !== "/docs" && (
                            <div className="mt-16 pt-8 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    {(() => {
                                        const flatItems = DOCS_MENU.flatMap(group => group.items);
                                        const currentIndex = flatItems.findIndex(item => item.href === pathname);
                                        const prev = currentIndex > 0 ? flatItems[currentIndex - 1] : null;
                                        const next = currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null;

                                        return (
                                            <>
                                                {prev ? (
                                                    <Link 
                                                        href={prev.href}
                                                        className="group p-4 rounded-3xl border border-slate-100 bg-white hover:border-teal/30 hover:shadow-lg transition-all"
                                                    >
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 group-hover:text-teal transition-colors">
                                                            <ArrowLeft className="w-3 h-3" />
                                                            Previous
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-800 break-words">
                                                            {prev.title}
                                                        </div>
                                                    </Link>
                                                ) : <div />}

                                                {next ? (
                                                    <Link 
                                                        href={next.href}
                                                        className="group p-4 rounded-3xl border border-slate-100 bg-white hover:border-teal/30 hover:shadow-lg transition-all text-right"
                                                    >
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end group-hover:text-teal transition-colors">
                                                            Next
                                                            <ChevronRight className="w-3 h-3" />
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-800 break-words">
                                                            {next.title}
                                                        </div>
                                                    </Link>
                                                ) : <div />}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Footer within Docs */}
                        <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
                            <p className="text-xs font-medium">© 2026 Signs AI Inc. All rights reserved.</p>
                            <div className="flex items-center gap-6">
                                <Link href="/privacy" className="text-xs hover:text-slate-600 transition-colors font-medium">Privacy Policy</Link>
                                <Link href="/terms" className="text-xs hover:text-slate-600 transition-colors font-medium">Terms of Service</Link>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
