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
    Search,
    HelpCircle,
    Target,
    CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS_MENU = [
    {
        title: "はじめに",
        items: [
            { title: "Signs AIとは？", href: "/docs/introduction", icon: BookOpen },
        ]
    },
    {
        title: "設定と連携",
        items: [
            { title: "Slack連携の手順", href: "/docs/slack-integration", icon: MessageSquare },
            { title: "メンバーの招待・管理", href: "/docs/member-management", icon: Users },
            { title: "KPIの設定と入力", href: "/docs/kpi-setup", icon: BarChart3 },
            { title: "組織方針の登録", href: "/docs/policy-guide", icon: Target },
        ]
    },
    {
        title: "機能の使い方",
        items: [
            { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: Target },
            { title: "アクション管理の使い方", href: "/docs/action-guide", icon: CheckSquare },
            { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: BarChart3 },
            { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: BookOpen },
        ]
    }
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <span className="text-white font-black text-sm italic">S</span>
                        </div>
                        <span className="font-black text-slate-800 tracking-tight">Signs AI <span className="text-slate-400 font-medium ml-1">Docs</span></span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Search documentation...</span>
                        <span className="text-[10px] bg-white border border-slate-200 px-1 rounded ml-2 font-mono">⌘K</span>
                    </div>
                    <Link href="/" className="text-xs font-bold text-slate-600 hover:text-teal flex items-center gap-1.5 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Dashboard
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl mx-auto w-full">
                {/* Sidebar Navigation */}
                <aside className="w-64 border-r border-slate-100 hidden md:block pt-8 pb-12 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
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

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="p-6 md:p-12 max-w-3xl mx-auto">
                        {children}

                        {/* Footer within Docs */}
                        <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
                            <p className="text-xs font-medium">© 2026 Signs AI Inc. All rights reserved.</p>
                            <div className="flex items-center gap-6">
                                <Link href="#" className="text-xs hover:text-slate-600 transition-colors font-medium">Privacy Policy</Link>
                                <Link href="#" className="text-xs hover:text-slate-600 transition-colors font-medium">Terms of Service</Link>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
