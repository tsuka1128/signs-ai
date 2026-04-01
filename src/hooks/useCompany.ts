"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { Company } from "@/types/database";

export type { Company };

export function useCompany() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [company, setCompany] = useState<Company | null>(null);
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

                // ロールを確認（代理ログインの可否判定用）
                const { data: userData } = await supabase
                    .from('users')
                    .select('company_id, role')
                    .eq('id', authUser.id)
                    .single();

                let effectiveCompanyId = userData?.company_id;
                let usedImpersonation = false;

                // super_admin の場合のみ、代理ログイン ID を確認
                if (userData?.role === 'super_admin' && typeof window !== "undefined") {
                    const impersonatedId = localStorage.getItem("impersonated_company_id");
                    if (impersonatedId) {
                        effectiveCompanyId = impersonatedId;
                        usedImpersonation = true;
                    }
                }

                setIsImpersonating(usedImpersonation);

                if (!effectiveCompanyId) {
                    if (!usedImpersonation && !pathname?.startsWith('/onboarding')) {
                        router.push("/onboarding");
                    }
                    return;
                }

                // キャッシュを避け、最新の情報を取得
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
    }, [supabase, router, pathname, isImpersonating]); // isImpersonating の変化も監視

    return { company, loading, user, supabase, isImpersonating };
}
