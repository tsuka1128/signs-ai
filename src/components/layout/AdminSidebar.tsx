"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    LogOut,
    ShieldAlert,
    CreditCard,
    HelpCircle,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const MENU_ITEMS = [
    { name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
    { name: "契約企業管理", href: "/admin/companies", icon: Building2 },
    { name: "管理者アカウント", href: "/admin/users", icon: Users },
    { name: "プラン・請求", href: "/admin/billing", icon: CreditCard },
    { name: "プラン仕様・機能定義", href: "/admin/plans", icon: Info },
    { name: "システムアラート", href: "/admin/alerts", icon: ShieldAlert },
    { name: "設定", href: "/admin/settings", icon: Settings },
    { name: "操作ログ", href: "/admin/logs", icon: ShieldAlert },
    { name: "操作マニュアル", href: "/admin/help", icon: HelpCircle },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center font-black text-white shadow-lg shadow-teal/20">S</div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-widest uppercase mb-0.5">SignsAI</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Admin Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                                isActive
                                    ? "bg-teal/10 text-teal shadow-sm shadow-teal/5"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-teal" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            {item.name}
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-4">
                <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black">AD</div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Super Admin</p>
                            <p className="text-xs font-bold text-white truncate">運営管理者</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                >
                    <LogOut className="w-5 h-5" />
                    ログアウト
                </button>
            </div>
        </aside>
    );
}
