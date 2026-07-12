"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/ui/Loading";
import { Lock, CalendarDays } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { MonthlyFocusTab } from "@/components/settings/MonthlyFocusTab";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function MonthlyFocusPage() {
    useDocumentTitle("今月の重点");
    const router = useRouter();
    const { company, loading, userRole } = useCompany();

    // 経営層ロール（admin / executive / super_admin）のみアクセス可
    const canAccess = userRole === "admin" || userRole === "executive" || userRole === "super_admin";

    useEffect(() => {
        if (!loading && !canAccess) {
            router.push("/");
        }
    }, [loading, canAccess, router]);

    if (loading) {
        return <Loading fullScreen message="読み込み中..." />;
    }

    return (
        <AppLayout currentSection="monthly-focus">
            <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-6">
                {/* ページヘッダー */}
                <div className="border-b border-slate-100 pb-6">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-teal" />
                        今月の組織目標
                    </h1>
                    <p className="text-xs text-slate-400 font-bold mt-1.5">
                        経営層として今月注力する課題を記録します（プレイヤー向けの「組織の温度」ページに公開されます）
                    </p>
                </div>

                {canAccess ? (
                    <MonthlyFocusTab companyId={company?.id} />
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-md mx-auto">
                        <Lock className="w-12 h-12 mx-auto text-rose-500 bg-rose-50 p-2.5 rounded-2xl mb-4 border border-rose-100" />
                        <h3 className="text-base font-black text-slate-800 tracking-tight">アクセス権限がありません</h3>
                        <p className="text-xs text-slate-400 font-bold mt-2">
                            今月の組織目標は経営層ロール（管理者・役員）専用です。
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
