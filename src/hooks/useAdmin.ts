"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function useAdmin() {
    const router = useRouter();
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
                    router.push("/login?redirect=/admin");
                    return;
                }
                setUser(authUser);

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', authUser.id)
                    .single();

                if (error || userData?.role !== 'super_admin') {
                    console.error("Access denied: Not a super_admin");
                    router.push("/");
                    return;
                }

                setIsSuperAdmin(true);
            } catch (error) {
                console.error("Error in useAdmin:", error);
                router.push("/");
            } finally {
                setLoading(false);
            }
        }

        checkAdmin();
    }, [supabase, router]);

    const impersonate = (id: string) => {
        if (!isSuperAdmin) return;
        localStorage.setItem("impersonated_company_id", id);
        setImpersonatedCompanyId(id);
        router.push("/");
    };

    const stopImpersonating = () => {
        localStorage.removeItem("impersonated_company_id");
        setImpersonatedCompanyId(null);
        router.push("/admin/companies");
    };

    return { loading, user, isSuperAdmin, impersonatedCompanyId, impersonate, stopImpersonating, supabase };
}
