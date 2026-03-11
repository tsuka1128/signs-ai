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

                const { data: userData } = await supabase
                    .from('users')
                    .select('company_id')
                    .eq('id', authUser.id)
                    .single();

                if (!userData?.company_id) {
                    router.push("/onboarding");
                    return;
                }

                const { data: compInfo } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', userData.company_id)
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

    return { company, loading, user, supabase };
}
