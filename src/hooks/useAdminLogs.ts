"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { AdminActivityLog } from "@/types/database";

export function useAdminLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            // ログの取得（実行者情報と企業情報を結合）
            const { data, error } = await supabase
                .from('admin_activity_logs')
                .select(`
                    *,
                    admin:users!admin_id(display_name, email),
                    company:companies!target_company_id(name)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err: any) {
            console.error("Failed to fetch admin logs:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    return { logs, loading, error, fetchLogs };
}
