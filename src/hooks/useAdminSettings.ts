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
            // 新規・更新・削除をまとめて処理
            // 現状は既存の ID があるものは Update、ないものは Insert とみなす簡易実装
            const toUpdate = depts.filter(d => !d.is_new);
            const toCreate = depts.filter(d => d.is_new).map(({ id, is_new, ...rest }) => ({ ...rest, company_id: companyId }));

            const results = await Promise.all([
                ...toUpdate.map(d => supabase.from('departments').update({ name: d.name, headcount: d.headcount, sort_order: d.sort_order }).eq('id', d.id)),
                toCreate.length > 0 ? supabase.from('departments').insert(toCreate) : Promise.resolve({ error: null })
            ]);

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
            const toUpdate = kpis.filter(k => !k.is_new);
            const toCreate = kpis.filter(k => k.is_new).map(({ id, is_new, ...rest }) => ({ ...rest, company_id: companyId }));

            const results = await Promise.all([
                ...toUpdate.map(k => supabase.from('kpi_definitions').update({
                    name: k.name,
                    unit: k.unit,
                    sort_order: k.sort_order,
                    is_main: k.is_main
                }).eq('id', k.id)),
                toCreate.length > 0 ? supabase.from('kpi_definitions').insert(toCreate) : Promise.resolve({ error: null })
            ]);

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
