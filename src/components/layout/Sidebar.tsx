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
    Brain,
    Wallet,
    Crown
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { signOut } from "@/lib/auth";
import { DOCS_MENU } from "@/lib/docs-menu";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

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
    const { canUse } = usePlanFeatures();
    const [companyName, setCompanyName] = useState("");
    const [userInitial, setUserInitial] = useState("?");
    const [userRole, setUserRole] = useState<string>("player");
    const isDashboardActive = pathname === '/' || pathname === '/dashboard';
    const [isDashboardExpanded, setIsDashboardExpanded] = useState(isDashboardActive);

    const isProActive = pathname === '/hr-strategy' || (isDashboardActive && currentSection === 'finance');
    const [isProExpanded, setIsProExpanded] = useState(isProActive);
    const isPro = canUse('labor_analytics');
    const [showProGate, setShowProGate] = useState(false);
    const router = useRouter();

    const [isDocsExpanded, setIsDocsExpanded] = useState(pathname.startsWith("/docs"));
    const [expandedDocsGroups, setExpandedDocsGroups] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        DOCS_MENU.forEach(group => {
            if (group.items.some(item => item.href === pathname)) {
                initial.add(group.title);
            }
        });
        return initial;
    });
    const [isManageOpen, setIsManageOpen] = useState(false);

    const isDocsActive = pathname.startsWith("/docs");

    const toggleDocsGroup = (title: string) => {
        setExpandedDocsGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

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
                    setUserRole(profile.role || "player");
                }
            }
        };
        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error("ログアウトエラー:", err);
            // signOut が失敗しても強制的にログイン画面へ遷移する
        } finally {
            // replace() で履歴を上書きし、戻るボタンでダッシュボードに戻れないようにする
            window.location.replace("/login");
        }
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

    const proNav = (userRole === 'super_admin' || userRole === 'admin' || userRole === 'executive') ? (
        <div className="space-y-1">
            <button
                onClick={() => setIsProExpanded(!isProExpanded)}
                className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group",
                    isProActive ? "text-teal bg-teal/5" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
            >
                <Users className={cn("w-4.5 h-4.5", isProActive ? "text-teal" : "text-slate-400 group-hover:text-slate-500")} />
                人事戦略
                <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-auto tracking-widest">PRO</span>
                <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", isProExpanded ? "" : "-rotate-90")} />
            </button>

            {isProExpanded && (
                <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-left-2 duration-200">
                    <button
                        onClick={() => {
                            if (!isPro) { setShowProGate(true); return; }
                            if (!isDashboardActive) {
                                window.location.href = '/?sec=finance';
                            } else {
                                onSectionChange?.('finance');
                                setIsMobileOpen?.(false);
                            }
                        }}
                        className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                            (isDashboardActive && currentSection === 'finance')
                                ? "text-teal bg-teal/5"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Activity className={cn("w-3.5 h-3.5", (isDashboardActive && currentSection === 'finance') ? "text-teal" : "text-slate-300")} />
                        人件費分析
                    </button>
                    <button
                        onClick={() => {
                            if (!isPro) { setShowProGate(true); return; }
                            router.push('/hr-strategy');
                            setIsMobileOpen?.(false);
                        }}
                        className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left",
                            pathname === '/hr-strategy'
                                ? "text-teal bg-teal/5"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Users className={cn("w-3.5 h-3.5", pathname === '/hr-strategy' ? "text-teal" : "text-slate-300")} />
                        人事インサイト
                    </button>
                </div>
            )}
        </div>
    ) : null;

    const proGateModal = showProGate ? (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowProGate(false)}
        >
            <div
                className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                            <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800">Proプラン限定機能</p>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Pro Feature</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowProGate(false)}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                    >
                        <span className="text-lg leading-none">✕</span>
                    </button>
                </div>

                {/* 説明 */}
                <div className="space-y-3">
                    <p className="text-sm font-black text-slate-700">人事戦略インサイトでできること</p>
                    <div className="space-y-2">
                        {[
                            "リスクアラート：組織の異変を早期検知",
                            "エンゲージメントドライバー分析：KPI直結要因の特定",
                            "人件費ROI・象限分析：コスト効率の可視化",
                            "体温改善シミュレーター：経済インパクト試算",
                            "AI人事戦略提言：月次での経営アクション提案",
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-500 font-bold leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="pt-2">
                    <button
                        onClick={() => { window.open('/marketing#pricing', '_blank'); setShowProGate(false); }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                    >
                        <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                        Proプランを確認する
                    </button>
                    <p className="text-[10px] text-slate-400 text-center font-bold mt-4 uppercase tracking-widest">
                        プランの変更は管理者にお問い合わせください
                    </p>
                </div>
            </div>
        </div>
    ) : null;

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
                        {proNav}
                    </div>

                    {/* Support Section */}
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">Support</p>
                        <div className="space-y-1">
                            <button
                                onClick={() => setIsDocsExpanded(!isDocsExpanded)}
                                className={cn(
                                    "flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group",
                                    isDocsActive ? "text-teal" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                )}
                            >
                                <HelpCircle className={cn("w-4.5 h-4.5", isDocsActive ? "text-teal" : "text-slate-400 group-hover:text-slate-500")} />
                                ヘルプ・マニュアル
                                <div className="ml-auto">
                                    {isDocsExpanded ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                                </div>
                            </button>

                            {isDocsExpanded && (
                                <div className="ml-4 pl-4 border-l border-slate-100 space-y-3 mt-1 animate-in slide-in-from-left-2 duration-200">
                                    <Link
                                        href="/docs"
                                        onClick={() => setIsMobileOpen?.(false)}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                                            pathname === "/docs"
                                                ? "text-teal bg-teal/5"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <HelpCircle className={cn("w-3.5 h-3.5", pathname === "/docs" ? "text-teal" : "text-slate-300")} />
                                        ドキュメントトップ
                                    </Link>

                                    {DOCS_MENU.map((group) => {
                                        const isGroupExpanded = expandedDocsGroups.has(group.title);
                                        const hasActiveItem = group.items.some(item => item.href === pathname);
                                        return (
                                            <div key={group.title} className="space-y-1">
                                                <button
                                                    onClick={() => toggleDocsGroup(group.title)}
                                                    className={cn(
                                                        "flex w-full items-center justify-between px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors",
                                                        hasActiveItem
                                                            ? "text-teal/70 hover:text-teal"
                                                            : "text-slate-300 hover:text-slate-500"
                                                    )}
                                                >
                                                    <span>{group.title}</span>
                                                    {isGroupExpanded
                                                        ? <ChevronDown className="w-3 h-3 opacity-60" />
                                                        : <ChevronRight className="w-3 h-3 opacity-60" />}
                                                </button>
                                                {isGroupExpanded && (
                                                    <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                                                        {group.items.map((item) => {
                                                            const isActive = pathname === item.href;
                                                            return (
                                                                <Link
                                                                    key={item.href}
                                                                    href={item.href}
                                                                    onClick={() => setIsMobileOpen?.(false)}
                                                                    className={cn(
                                                                        "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                                                                        isActive
                                                                            ? "text-teal bg-teal/5"
                                                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                                    )}
                                                                >
                                                                    <item.icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-teal" : "text-slate-300")} />
                                                                    <span className="leading-tight">{item.title}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
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
                                    {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager') && (
                                        <Link 
                                            href="/kpi" 
                                            onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                        >
                                            <Activity className="w-4 h-4 text-slate-400" />
                                            KPI入力
                                        </Link>
                                    )}
                                    {(userRole === 'super_admin' || userRole === 'admin') && (
                                        <Link 
                                            href="/voice-check" 
                                            onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                            ボイスチェック
                                        </Link>
                                    )}
                                    {(userRole === 'super_admin' || userRole === 'admin') && (
                                        <Link 
                                            href="/settings" 
                                            onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                        >
                                            <Settings className="w-4 h-4 text-slate-400" />
                                            設定管理
                                        </Link>
                                    )}
                                    {(userRole === 'super_admin' || userRole === 'admin') && canUse('labor_analytics') && (
                                        <Link 
                                            href="/labor"
                                            onClick={() => { setIsManageOpen(false); setIsMobileOpen?.(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
                                        >
                                            <Wallet className="w-4 h-4 text-slate-400" />
                                            人件費入力
                                            <span className="ml-auto text-[8px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-md font-black italic">PRO</span>
                                        </Link>
                                    )}
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
            {proGateModal}
        </>
    );
}
