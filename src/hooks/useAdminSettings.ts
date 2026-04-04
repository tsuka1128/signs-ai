import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export function useAdminSettings(companyId: string) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchDepartments = useCallback(async () => {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', companyId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase, companyId]);

    const fetchKpis = useCallback(async () => {
        const { data, error } = await supabase
            .from('kpi_definitions')
            .select('*')
            .eq('company_id', companyId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase, companyId]);

    const updateDepartments = async (depts: any[]) => {
        setLoading(true);
        try {
            // 1. 削除処理: 現在のDBにあるIDのうち、引数のリストに含まれないものを削除
            const { data: existing } = await supabase.from('departments').select('id').eq('company_id', companyId);
            const existingIds = existing?.map(e => e.id) || [];
            const currentIds = depts.filter(d => !d.is_new).map(d => d.id);
            const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

            if (idsToDelete.length > 0) {
                const { error: delErr } = await supabase.from('departments').delete().in('id', idsToDelete);
                if (delErr) throw delErr;
            }

            // 2. 更新・作成処理 (sort_order をインデックスに基づいて再設定)
            const prompts = depts.map((d, index) => {
                const payload = { 
                    name: d.name, 
                    headcount: d.headcount, 
                    sort_order: index 
                };
                if (d.is_new) {
                    return supabase.from('departments').insert({ ...payload, company_id: companyId });
                } else {
                    return supabase.from('departments').update(payload).eq('id', d.id);
                }
            });

            const results = await Promise.all(prompts);
            const firstError = results.find(r => r.error)?.error;
            if (firstError) throw firstError;
        } finally {
            setLoading(false);
        }
    };

    const deleteDepartment = async (id: string) => {
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) throw error;
    };

    const updateKpis = async (kpis: any[]) => {
        setLoading(true);
        try {
            // 1. 削除処理
            const { data: existing } = await supabase.from('kpi_definitions').select('id').eq('company_id', companyId);
            const existingIds = existing?.map(e => e.id) || [];
            const currentIds = kpis.filter(k => !k.is_new).map(k => k.id);
            const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

            if (idsToDelete.length > 0) {
                const { error: delErr } = await supabase.from('kpi_definitions').delete().in('id', idsToDelete);
                if (delErr) throw delErr;
            }

            // 2. 更新・作成処理
            const prompts = kpis.map((k, index) => {
                const payload = {
                    name: k.name,
                    unit: k.unit,
                    is_main: k.is_main,
                    sort_order: index
                };
                if (k.is_new) {
                    return supabase.from('kpi_definitions').insert({ ...payload, company_id: companyId });
                } else {
                    return supabase.from('kpi_definitions').update(payload).eq('id', k.id);
                }
            });

            const results = await Promise.all(prompts);
            const firstError = results.find(r => r.error)?.error;
            if (firstError) throw firstError;
        } finally {
            setLoading(false);
        }
    };

    const deleteKpi = async (id: string) => {
        const { error } = await supabase.from('kpi_definitions').delete().eq('id', id);
        if (error) throw error;
    };

    return {
        loading,
        fetchDepartments,
        fetchKpis,
        updateDepartments,
        deleteDepartment,
        updateKpis,
        deleteKpi
    };
}
