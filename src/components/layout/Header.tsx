"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Menu, X, Bell, CheckCircle2, ChevronDown, LogOut, UserCog } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [deptName, setDeptName] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [axisName, setAxisName] = useState<string | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [depts, setDepts] = useState<any[]>([]);
    const [axes, setAxes] = useState<any[]>([]);
    const [profileForm, setProfileForm] = useState({
        display_name: "", department_id: "", axis_id: "", slack_user_id: ""
    });
    const [profileSaving, setProfileSaving] = useState(false);

    const { unreadCount, notifications, markAsRead, handleNotificationClick } = useNotifications();

    // ロール日本語変換
    const ROLE_LABELS: Record<string, string> = {
        admin: "管理者",
        executive: "経営層",
        manager: "マネージャー",
        player: "一般メンバー",
        partner: "外部パートナー",
        super_admin: "Super Admin",
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserInitial(user.email?.[0].toUpperCase() || "U");
                setUserEmail(user.email ?? "");

                const { data: profile } = await supabase
                    .from("users")
                    .select("role, department_id, axis_id, display_name, slack_user_id, companies(id, name, plans(name))")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role ?? null);
                }

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

                // 部署・担当領域の選択肢を取得
                if (profile) {
                    const effectiveCompanyId = impersonatedId || (profile as any)?.companies?.id;
                    if (effectiveCompanyId) {
                        const [deptsRes, axesRes] = await Promise.all([
                            supabase.from("departments").select("id, name").eq("company_id", effectiveCompanyId).order("sort_order"),
                            supabase.from("axes").select("id, name").eq("company_id", effectiveCompanyId),
                        ]);
                        setDepts(deptsRes.data ?? []);
                        setAxes(axesRes.data ?? []);
                        setDeptName(deptsRes.data?.find((d: any) => d.id === profile.department_id)?.name ?? null);
                        setAxisName(axesRes.data?.find((a: any) => a.id === (profile as any).axis_id)?.name ?? null);
                        setProfileForm({
                            display_name: profile.display_name ?? "",
                            department_id: profile.department_id ?? "",
                            axis_id: (profile as any).axis_id ?? "",
                            slack_user_id: (profile as any).slack_user_id ?? "",
                        });
                    }
                }
            }
        };
        fetchUserData();
    }, []);

    return (
        <>
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sticky top-0 z-50">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button
                    onClick={onMobileMenuClick}
                    aria-label="メニューを開く"
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
                        aria-label="通知"
                        aria-haspopup="true"
                        aria-expanded={showNotifications}
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
                                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                                    <Link 
                                        href="/history" 
                                        onClick={() => setShowNotifications(false)}
                                        className="text-[11px] font-bold text-teal hover:text-teal/80 transition-colors inline-block"
                                    >
                                        すべての通知を見る →
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="h-8 w-px bg-slate-100 mx-1" />
                
                {/* User Info Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        aria-label="アカウントメニュー"
                        aria-haspopup="true"
                        aria-expanded={showUserMenu}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black text-[10px] shrink-0">
                            {userInitial}
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-tight">
                            <span className="text-[11px] font-black text-slate-700 max-w-[120px] truncate">
                                {deptName ?? "未設定"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {userRole ? (ROLE_LABELS[userRole] ?? userRole) : "未設定"}
                            </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-[10px] font-black text-slate-800 truncate">{userEmail}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                        {deptName ?? "部署未設定"} · {userRole ? (ROLE_LABELS[userRole] ?? userRole) : "ロール未設定"}
                                    </p>
                                    {axisName && (
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                            担当領域: {axisName}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-50"
                                >
                                    <UserCog className="w-3.5 h-3.5 text-slate-400" />
                                    プロフィール設定
                                </button>
                                <button
                                    onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
                                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                                    ログアウト
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>

        {/* Profile Edit Modal */}
        {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800 tracking-tighter">プロフィール設定</h3>
                        <button onClick={() => setShowProfileModal(false)} aria-label="閉じる" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="p-8 space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">氏名 (任意)</label>
                            <input
                                type="text"
                                value={profileForm.display_name}
                                onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                                placeholder="例: 佐藤 太郎"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">所属部署</label>
                            <select
                                value={profileForm.department_id}
                                onChange={(e) => setProfileForm({ ...profileForm, department_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                            >
                                <option value="">未設定</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">担当領域</label>
                            <select
                                value={profileForm.axis_id}
                                onChange={(e) => setProfileForm({ ...profileForm, axis_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                            >
                                <option value="">未設定</option>
                                {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Slack User ID (任意)</label>
                            <input
                                type="text"
                                value={profileForm.slack_user_id}
                                onChange={(e) => setProfileForm({ ...profileForm, slack_user_id: e.target.value })}
                                placeholder="例: U12345678"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                            />
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 flex gap-3">
                        <button
                            onClick={() => setShowProfileModal(false)}
                            className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-slate-400 font-bold"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={async () => {
                                setProfileSaving(true);
                                try {
                                    const res = await fetch("/api/profile", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(profileForm),
                                    });
                                    if (res.ok) {
                                        setDeptName(depts.find(d => d.id === profileForm.department_id)?.name ?? null);
                                        setAxisName(axes.find(a => a.id === profileForm.axis_id)?.name ?? null);
                                        setShowProfileModal(false);
                                        toast.success("プロフィールを更新しました");
                                    } else {
                                        toast.error("プロフィールの保存に失敗しました");
                                    }
                                } catch {
                                    toast.error("プロフィールの保存に失敗しました");
                                } finally {
                                    setProfileSaving(false);
                                }
                            }}
                            disabled={profileSaving}
                            className="flex-[2] py-4 bg-teal text-white rounded-2xl font-black shadow-lg shadow-teal/20 hover:bg-teal-600 transition-all disabled:opacity-50"
                        >
                            {profileSaving ? "保存中..." : "保存する"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
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
