"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { Company, Plan } from "@/types/database";
import { differenceInDays } from "date-fns";

export type { Company };

export function useCompany() {
    const router = useRouter();
    const pathname = usePathname();
    
    // Supabaseクライアントをメモ化して、再レンダリングごとのインスタンス生成を抑制
    const supabase = useMemo(() => createClient(), []);
    
    const [company, setCompany] = useState<Company | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    const [userRole, setUserRole] = useState<string | null>(null);
    const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);

    // 1. 同期用: localStorage の変更を監視
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "impersonated_company_id") {
                setIsImpersonating(!!e.newValue);
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

                const { data: userData } = await supabase.from('users').select('company_id, role, department_id').eq('id', authUser.id).single();
                
                if (userData) {
                    setUserRole(userData.role);
                    setUserDepartmentId(userData.department_id);
                }

                let targetId = userData?.company_id;
                let usedImpersonation = false;

                if (userData?.role === 'super_admin') {
                    const storedId = typeof window !== "undefined" ? localStorage.getItem("impersonated_company_id") : null;
                    if (storedId) {
                        targetId = storedId;
                        usedImpersonation = true;
                    }
                }

                setIsImpersonating(usedImpersonation);

                if (!targetId) {
                    // super_admin は自身の company_id を持たない設計のため、
                    // なりすまし対象未選択の場合は「新規会社作成」ではなく管理画面へ誘導する
                    if (userData?.role === 'super_admin') {
                        if (!pathname?.startsWith('/admin') && !pathname?.startsWith('/form')) {
                            router.push("/admin");
                        }
                    } else if (!usedImpersonation && !pathname?.startsWith('/onboarding') && !pathname?.startsWith('/form')) {
                        router.push("/onboarding");
                    }
                    setLoading(false);
                    return;
                }

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
    const trialDaysRemaining = company?.trial_expires_at
        ? Math.max(0, differenceInDays(new Date(company.trial_expires_at), new Date()))
        : company
        ? Math.max(0, (plan?.trial_duration_days || defaultTrialDays) - differenceInDays(new Date(), new Date(company.created_at)))
        : null;

    return { 
        company, 
        plan, 
        loading, 
        user, 
        supabase, 
        isImpersonating, 
        isTrial, 
        trialDaysRemaining,
        userRole,
        userDepartmentId
    };
}
