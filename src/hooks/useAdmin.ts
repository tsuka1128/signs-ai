"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function useAdmin() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

    useEffect(() => {
        setImpersonatedCompanyId(localStorage.getItem("impersonated_company_id"));
    }, []);

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    // 管理者ページ (/admin) にアクセスしている場合のみログインへ飛ばす
                    if (pathname?.startsWith('/admin')) {
                        router.push("/login?redirect=/admin");
                    }
                    setLoading(false);
                    return;
                }
                setUser(authUser);

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', authUser.id)
                    .single();

                if (error || userData?.role !== 'super_admin') {
                    // 代理ログイン中の場合は、権限不足エラーを出さずに終了（バナー表示のため）
                    const currentImpersonatedId = typeof window !== "undefined" ? localStorage.getItem("impersonated_company_id") : null;
                    if (currentImpersonatedId) {
                        setIsSuperAdmin(true);
                        setLoading(false);
                        return;
                    }
                    console.error("Access denied: Not a super_admin");
                    router.push("/");
                    return;
                }

                setIsSuperAdmin(true);
            } catch (error) {
                console.error("Error in useAdmin:", error);
                const currentImpersonatedId = typeof window !== "undefined" ? localStorage.getItem("impersonated_company_id") : null;
                if (!currentImpersonatedId) router.push("/");
            } finally {
                setLoading(false);
            }
        }

        checkAdmin();
    }, [supabase, router]);

    const logAdminActivity = async (actionType: string, targetId: string | null = null) => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            await supabase.from('admin_activity_logs').insert({
                admin_id: authUser.id,
                target_company_id: targetId,
                action_type: actionType,
                details: {
                    pathname,
                    userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server"
                }
            });
        } catch (err) {
            console.error("Failed to log admin activity:", err);
        }
    };

    const impersonate = async (id: string) => {
        if (!isSuperAdmin) return;
        localStorage.setItem("impersonated_company_id", id);
        setImpersonatedCompanyId(id);
        
        // ログを非同期で記録
        await logAdminActivity('impersonate_start', id);
        
        router.push("/");
    };

    const stopImpersonating = async () => {
        const currentId = localStorage.getItem("impersonated_company_id");
        localStorage.removeItem("impersonated_company_id");
        setImpersonatedCompanyId(null);
        
        // ログを非同期で記録
        if (currentId) {
            await logAdminActivity('impersonate_stop', currentId);
        }
        
        router.push("/admin/companies");
    };

    return { loading, user, isSuperAdmin, impersonatedCompanyId, impersonate, stopImpersonating, supabase };
}
