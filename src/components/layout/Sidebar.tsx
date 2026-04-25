"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    Thermometer,
    Settings,
    HelpCircle,
    LogOut,
    Target,
    AreaChart,
    Users,
    Activity,
    BookOpen,
    Rocket,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Search,
    Brain
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { signOut } from "@/lib/auth";

interface SidebarProps {
    currentSection?: string;
    onSectionChange?: (id: string) => void;
    hasLaborData?: boolean;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}

const DASHBOARD_SUB_ITEMS = [
    { id: "report", label: "AI組織診断", icon: Brain },
    { id: "matrix", label: "マトリックス", icon: AreaChart },
    { id: "kpi", label: "KPI推移", icon: BarChart3 },
    { id: "org", label: "組織のKPI", icon: Target },
    { id: "finance", label: "人件費ROI", icon: Rocket, pro: true },
    { id: "survey", label: "組織の体温", icon: Thermometer },
    { id: "action", label: "アクション", icon: CheckCircle2 },
    { id: "semantic", label: "組織方針", icon: BookOpen },
];

export function Sidebar({ 
    currentSection, 
    onSectionChange, 
    hasLaborData, 
    isMobileOpen,
    setIsMobileOpen 
}: SidebarProps) {
    const pathname = usePathname();
    const supabase = createClient();
    const [companyName, setCompanyName] = useState("");
    const [userInitial, setUserInitial] = useState("?");
    const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const isDashboardActive = pathname === "/";

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserInitial(user.email?.[0].toUpperCase() || "U");
                const { data: profile } = await supabase
                    .from("users")
                    .select("role, companies(name)")
                    .eq("id", user.id)
                    .single();
                
                if (profile) {
                    setCompanyName((profile as any).companies?.name || "Signs AI User");
                }
            }
        };
        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/login";
    };

    const renderLink = (href: string, label: string, Icon: any, active?: boolean) => {
        const isActive = active !== undefined ? active : pathname === href;
        return (
            <Link
                href={href}
                onClick={() => setIsMobileOpen?.(false)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group",
                    isActive
                        ? "bg-teal/5 text-teal"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
            >
                <Icon className={cn("w-4.5 h-4.5", isActive ? "text-teal" : "text-slate-400 group-hover:text-slate-500")} />
                {label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_8px_rgba(20,184,166,0.5)]" />}
            </Link>
        );
    };

    const dashboardNav = (
        <div className="space-y-1">
            <button
                onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
                className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group",
                    isDashboardActive ? "text-teal" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
            >
                <LayoutDashboard className={cn("w-4.5 h-4.5", isDashboardActive ? "text-teal" : "text-slate-400 group-hover:text-slate-500")} />
                ダッシュボード
                <div className="ml-auto">
                    {isDashboardExpanded ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                </div>
            </button>

            {isDashboardExpanded && (
                <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-left-2 duration-200">
                    {DASHBOARD_SUB_ITEMS.map((item) => {
                        if (item.id === "finance" && !hasLaborData) return null;
                        const isActive = isDashboardActive && currentSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (!isDashboardActive) {
                                        window.location.href = `/?sec=${item.id}`;
                                    } else {
                                        onSectionChange?.(item.id);
                                        setIsMobileOpen?.(false);
                                    }
                                }}
                                className={cn(
                                    "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                                    isActive
                                        ? "text-teal bg-teal/5"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-teal" : "text-slate-300")} />
                                {item.label}
                                {item.pro && <span className="ml-auto text-[8px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-md font-black italic">PRO</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300" 
                    onClick={() => setIsMobileOpen?.(false)}
                />
            )}

            <aside className={cn(
                "fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-[100] transition-transform duration-300 lg:translate-x-0 flex flex-col",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Logo */}
                <div className="p-7">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                            <span className="text-white font-black text-lg italic">S</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">Signs AI</h1>
                            <p className="text-[9px] font-black text-slate-300 tracking-widest uppercase mt-1">組織に体温を</p>
                        </div>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* View Section */}
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">View</p>
                        {dashboardNav}
                    </div>

                    {/* Support Section */}
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">Support</p>
                        {renderLink("/docs", "ヘルプ・マニュアル", HelpCircle)}
                    </div>
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-slate-50 mt-auto bg-slate-50/30 relative">
                    {/* Management Popover */}
                    {isManageOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-[110]" 
                                onClick={() => setIsManageOpen(false)} 
                            />
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-[120] animate-in slide-in-from-bottom-2 duration-200">
                                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                    Management
                                </p>
                                <div className="space-y-0.5">
                                    <Link 
                                        href="/kpi" 
                                        onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                    >
                                        <Activity className="w-4 h-4 text-slate-400" />
                                        KPI入力
                                    </Link>
                                    <Link 
                                        href="/voice-check" 
                                        onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                        ボイスチェック
                                    </Link>
                                    <Link 
                                        href="/settings" 
                                        onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        設定管理
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mb-4">
                         <button 
                            onClick={() => setIsManageOpen(!isManageOpen)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-2xl bg-white border shadow-sm flex items-center gap-3 transition-all",
                                isManageOpen ? "border-teal/30 ring-4 ring-teal/5" : "border-slate-100 hover:border-slate-200"
                            )}
                         >
                            <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-teal-200">
                                {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{companyName || "COMPANY"}</p>
                                <p className="text-xs font-bold text-slate-800 truncate">Settings & Profile</p>
                            </div>
                            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-300 transition-transform", isManageOpen && "rotate-180")} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                    >
                        <LogOut className="w-4 h-4" />
                        ログアウト
                    </button>
                </div>
            </aside>
        </>
    );
}
