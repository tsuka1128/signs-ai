"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loading } from "@/components/ui/Loading";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, isSuperAdmin } = useAdmin();

    if (loading) {
        return <Loading fullScreen message="管理者権限を確認しています..." />;
    }

    if (!isSuperAdmin) {
        return null; // useAdmin 内でリダイレクトされる
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="pl-64">
                <div className="max-w-[1200px] mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
