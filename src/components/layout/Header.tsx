"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Menu, X, Bell, CheckCircle2 } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";

interface HeaderProps {
    isMobile?: boolean;
    onMobileMenuClick?: () => void;
}

export function Header({ isMobile, onMobileMenuClick }: HeaderProps) {
    const supabase = createClient();
    const router = useRouter();
    const [companyName, setCompanyName] = useState("Loading...");
    const [planName, setPlanName] = useState("");
    const [userInitial, setUserInitial] = useState("?");
    const [showNotifications, setShowNotifications] = useState(false);

    const { unreadCount, notifications, markAsRead, handleNotificationClick } = useNotifications();

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserInitial(user.email?.[0].toUpperCase() || "U");

                const { data: profile } = await supabase
                    .from("users")
                    .select("role, companies(id, name, plans(name))")
                    .eq("id", user.id)
                    .single();

                const impersonatedId = (profile?.role === 'super_admin' && typeof window !== "undefined")
                    ? localStorage.getItem("impersonated_company_id")
                    : null;

                if (impersonatedId) {
                    const { data: company } = await supabase
                        .from("companies")
                        .select("name, plans(name)")
                        .eq("id", impersonatedId)
                        .single();

                    if (company) {
                        setCompanyName(company.name);
                        const pName = Array.isArray(company.plans)
                            ? company.plans[0]?.name
                            : (company.plans as any)?.name;
                        setPlanName(pName || "Standard");
                    }
                } else if (profile) {
                    const comp = (profile as any).companies;
                    setCompanyName(comp?.name || "Signs AI User");
                    const pName = comp?.plans?.name || "Standard";
                    setPlanName(pName);
                }
            }
        };
        fetchUserData();
    }, []);

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sticky top-0 z-50">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button 
                    onClick={onMobileMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden lg:flex items-center gap-3">
                    <h2 className="text-sm font-black text-slate-800 tracking-tight">{companyName}</h2>
                    {planName && (
                        <Badge className="bg-teal/5 text-teal border-none text-[9px] font-black px-2 py-0.5">
                            {planName}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 relative">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2 transition-colors relative rounded-xl ${showNotifications ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Bell className="w-4.5 h-4.5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-rose-500 rounded-full border border-white text-[9px] text-white flex items-center justify-center px-0.5 font-black">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">通知</h3>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={() => markAsRead(notifications.map(n => n.id))}
                                            className="text-[10px] font-bold text-teal hover:text-teal/80 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            すべて既読
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => {
                                                    handleNotificationClick(n);
                                                    setShowNotifications(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex gap-3 group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                                        <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{n.title}</p>
                                                        <span className="shrink-0 text-[9px] font-bold text-slate-400 mt-0.5">
                                                            {formatRelativeTime(n.created_at)}
                                                        </span>
                                                    </div>
                                                    {n.body && <p className="text-[11px] text-slate-500 line-clamp-1">{n.body}</p>}
                                                </div>
                                                <div className="shrink-0 flex items-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-6 py-10 text-center">
                                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-[11px] font-bold text-slate-400 tracking-tight">新しい通知はありません</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="h-8 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-slate-400 tabular-nums uppercase tracking-widest hidden sm:block">
                        {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                        {userInitial}
                    </div>
                </div>
            </div>
        </header>
    );
}

function formatRelativeTime(dateString: string) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHour < 24) return `${diffHour}時間前`;
    if (diffDay < 7) return `${diffDay}日前`;
    return past.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
}
