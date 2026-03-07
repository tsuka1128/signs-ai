"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Header() {
    const router = useRouter();
    const supabase = createClient();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [companyName, setCompanyName] = useState("Loading...");
    const [planName, setPlanName] = useState("");
    const [userInitial, setUserInitial] = useState("?");

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserInitial(user.email?.[0].toUpperCase() || "U");
                const { data: profile } = await supabase
                    .from("users")
                    .select("display_name, companies(name, plans(name))")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    const comp = (profile as any).companies;
                    setCompanyName(comp?.name || "Signs AI User");
                    let pName = comp?.plans?.name || "Trial";
                    if (pName === "Free") pName = "Freetrial";
                    setPlanName(pName);
                }
            }
        };
        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    return (
        <header className="bg-gradient-to-br from-white via-slate-50 to-white px-5 py-6 border-b border-slate-200 relative z-[100]">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200 hover:scale-105 transition-transform">
                                <span className="text-white font-black text-lg italic">S</span>
                            </div>
                            <span className="text-xl font-extrabold text-slate-800 tracking-tighter">Signs AI</span>
                        </Link>
                        {planName && (
                            <Badge className="bg-teal/10 text-teal border-none text-[10px]">{planName}</Badge>
                        )}
                    </div>
                    <p className="text-[11px] font-black text-slate-400 tracking-widest mt-1 uppercase">組織に体温を</p>
                </div>

                {/* PC Menu */}
                <div className="hidden sm:flex items-center gap-6 text-right">
                    <div className="flex items-center gap-3">

                        <Link href="/marketing" className="text-[10px] font-bold bg-slate-800 text-white px-3 py-1.5 rounded-full hover:bg-teal transition-colors shadow-sm flex items-center gap-1">
                            🚀 マーケティングLP
                        </Link>
                        <Link href="/form" className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1">
                            💬 アンケート
                        </Link>
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-teal-300 transition-all ml-2 outline-none shadow-sm"
                            >
                                <span className="text-xs">{userInitial}</span>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute top-full mt-3 right-0 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
                                        <div className="px-4 py-3 border-b border-slate-100 mb-2">
                                            <p className="text-xs text-slate-500 font-medium mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-slate-800 truncate">{companyName}</p>
                                        </div>

                                        <Link href="/kpi" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal transition-colors flex items-center gap-2">
                                            📊 Monthly KPI Input
                                        </Link>

                                        <Link href="/settings" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal transition-colors flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-slate-400" /> Settings
                                        </Link>

                                        <div className="h-px bg-slate-100 my-2"></div>

                                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-rose-600 font-bold hover:bg-rose-50 transition-colors flex items-center gap-2">
                                            <LogOut className="w-3.5 h-3.5" /> Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Hamburger Button */}
                <div className="sm:hidden flex items-center gap-3">
                    <div className="text-right mr-2">
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">サンプルSaaS</p>
                        <p className="text-[10px] font-black text-slate-800 tabular-nums">2026.02</p>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 -mr-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm"
                    >
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl py-4 px-5 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200 z-[100]">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="col-span-2 text-sm font-bold bg-white border-2 border-slate-100 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:border-slate-300 flex items-center justify-center gap-2">
                            <span className="text-lg">📈</span> ダッシュボード
                        </Link>
                        <Link href="/form" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-1.5">
                            <span className="text-lg">💬</span> 調査
                        </Link>
                        <Link href="/marketing" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold bg-slate-800 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:bg-teal-600 transition-colors">
                            <span className="text-lg">🚀</span> LP
                        </Link>
                        <Link href="/kpi" onClick={() => setIsMenuOpen(false)} className="col-span-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-1.5">
                            <span className="text-lg">📊</span> KPI入力
                        </Link>
                        <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="col-span-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-1.5">
                            <Settings className="w-5 h-5 text-slate-400" /> 設定
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
