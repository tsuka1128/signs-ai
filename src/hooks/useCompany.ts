"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { Company, Plan } from "@/types/database";
import { differenceInDays, addDays } from "date-fns";

export type { Company };

export function useCompany() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [company, setCompany] = useState<Company | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    // 1. 同期用: localStorage の変更を監視
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "impersonated_company_id") {
                setIsImpersonating(!!e.newValue);
                // 再読み込みを促すために window.location.reload() するか、
                // あるいは最新の情報を fetch し直す (ここでは後者のパスを通すために loading を戻す)
                setLoading(true);
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("storage", handleStorageChange);
            setIsImpersonating(!!localStorage.getItem("impersonated_company_id"));
            return () => window.removeEventListener("storage", handleStorageChange);
        }
    }, []);

    // 2. データ取得: ページ遷移や状態変化に応じて実行
    useEffect(() => {
        async function loadCompany() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setLoading(false);
                    return;
                }
                setUser(authUser);

                // ロールと本来の所属を一括取得（アトミック判定）
                const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', authUser.id).single();
                
                let targetId = userData?.company_id;
                let usedImpersonation = false;

                // 管理者の場合は localStorage を直接確認
                if (userData?.role === 'super_admin') {
                    const storedId = typeof window !== "undefined" ? localStorage.getItem("impersonated_company_id") : null;
                    if (storedId) {
                        targetId = storedId;
                        usedImpersonation = true;
                    }
                }

                setIsImpersonating(usedImpersonation);

                if (!targetId) {
                    if (!usedImpersonation && !pathname?.startsWith('/onboarding')) {
                        router.push("/onboarding");
                    }
                    setLoading(false);
                    return;
                }

                // キャッシュを避け、最新の情報を取得
                const { data: compInfo } = await supabase
                    .from('companies')
                    .select('*, plans(*)')
                    .eq('id', targetId)
                    .single();

                if (compInfo) {
                    setCompany(compInfo);
                    setPlan(compInfo.plans);
                }
            } catch (error) {
                console.error("Error loading company context:", error);
            } finally {
                setLoading(false);
            }
        }

        loadCompany();
    }, [supabase, router, pathname]);

    const isTrial = company?.status === 'trial';
    const defaultTrialDays = 70;
    const trialDaysRemaining = company
        ? Math.max(0, (plan?.trial_duration_days || defaultTrialDays) - differenceInDays(new Date(), new Date(company.created_at)))
        : null;

    return { company, plan, loading, user, supabase, isImpersonating, isTrial, trialDaysRemaining };
}
