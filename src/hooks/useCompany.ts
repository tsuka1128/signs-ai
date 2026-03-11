"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export interface Company {
    id: string;
    name: string;
    secondary_axis_name: string;
    secondary_axis_size_kpi_id: string;
}

export function useCompany() {
    const router = useRouter();
    const supabase = createClient();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function loadCompany() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setLoading(false);
                    return;
                }
                setUser(authUser);

                // ロールを確認（代理ログインの可否判定用）
                const { data: userData } = await supabase
                    .from('users')
                    .select('company_id, role')
                    .eq('id', authUser.id)
                    .single();

                let effectiveCompanyId = userData?.company_id;
                let isImpersonatingFlag = false;

                // super_admin の場合のみ、代理ログイン ID を確認
                if (userData?.role === 'super_admin') {
                    const impersonatedId = localStorage.getItem("impersonated_company_id");
                    if (impersonatedId) {
                        effectiveCompanyId = impersonatedId;
                        isImpersonatingFlag = true;
                    }
                }

                if (!effectiveCompanyId) {
                    if (!isImpersonatingFlag) router.push("/onboarding");
                    return;
                }

                const { data: compInfo } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', effectiveCompanyId)
                    .single();

                if (compInfo) {
                    setCompany(compInfo);
                }
            } catch (error) {
                console.error("Error loading company context:", error);
            } finally {
                setLoading(false);
            }
        }

        loadCompany();
    }, [supabase, router]);

    return { company, loading, user, supabase, isImpersonating: !!localStorage.getItem("impersonated_company_id") };
}
