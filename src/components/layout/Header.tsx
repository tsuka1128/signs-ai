"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Menu, X, Bell } from "lucide-react";

interface HeaderProps {
    isMobile?: boolean;
    onMobileMenuClick?: () => void;
}

export function Header({ isMobile, onMobileMenuClick }: HeaderProps) {
    const supabase = createClient();
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

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
                </button>
                
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
