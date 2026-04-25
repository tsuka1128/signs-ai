"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { useCompany } from "@/hooks/useCompany";
import { usePathname } from "next/navigation";
import { ShieldAlert, LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/index";

export function ImpersonationBanner() {
    const { stopImpersonating } = useAdmin();
    const { company, isImpersonating, loading } = useCompany();
    const pathname = usePathname();

    // アトミックな判定
    const directImpersonating = typeof window !== "undefined" ? !!localStorage.getItem("impersonated_company_id") : false;
    const active = isImpersonating || directImpersonating;

    // 代理ログイン中でない場合は表示しない（管理画面でも常に表示し、操作中であることを明示する）
    if (!active) return null;

    return (
        <div className="sticky top-0 w-full z-[10000] animate-slideDown">
            <div className="bg-slate-900 border-b border-amber-500/30 px-4 py-2 shadow-2xl overflow-hidden relative group">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 opacity-50" />

                <div className="max-w-[1400px] mx-auto flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Impersonating</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-bold text-white">
                                <span className="text-slate-400 font-medium whitespace-nowrap">現在は</span>
                                <span className={cn(
                                    "mx-1.5 text-amber-50 px-1 rounded bg-amber-500/10",
                                    (loading || !company) && "animate-pulse bg-slate-700 text-transparent"
                                )}> 
                                    {company ? company.name : "Loading..."} 
                                </span>
                                <span className="text-slate-400 font-medium whitespace-nowrap">の視点でログインしています</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            操作内容はすべて対象企業のデータに反映されます
                        </p>
                        <button
                            onClick={stopImpersonating}
                            className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            代理ログインを終了して管理画面に戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
