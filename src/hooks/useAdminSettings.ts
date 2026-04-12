import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getLastNMonths } from "@/lib/utils/date";

export function useAdminSettings(companyId: string) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    /**
     * 企業基本情報を取得する
     */
    const fetchCompany = useCallback(async () => {
        const { data, error } = await supabase
            .from('companies')
            .select('*, plans(name)')
            .eq('id', companyId)
            .single();
        if (error) throw error;
        return data;
    }, [supabase, companyId]);

    /**
     * 企業基本情報を更新する
     */
    const updateCompany = async (updates: Record<string, any>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update(updates)
                .eq('id', companyId);
            if (error) throw error;

            // ログ記録
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                await supabase.from('admin_activity_logs').insert({
                    admin_id: authUser.id,
                    target_company_id: companyId,
                    action_type: 'update_company_settings',
                    details: {
                        updated_fields: Object.keys(updates),
                        timestamp: new Date().toISOString()
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

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

            // ログ記録
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                await supabase.from('admin_activity_logs').insert({
                    admin_id: authUser.id,
                    target_company_id: companyId,
                    action_type: 'update_departments',
                    details: {
                        count: depts.length,
                        deleted_count: idsToDelete.length,
                        timestamp: new Date().toISOString()
                    }
                });
            }
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

    /**
     * KPI実績・リソース実績の取得およびCSV生成ロジック
     */
    
    const fetchAllKpiRecords = useCallback(async (kpiIds: string[]) => {
        if (kpiIds.length === 0) return [];
        const { data, error } = await supabase
            .from('kpi_records')
            .select('*')
            .in('kpi_definition_id', kpiIds)
            .order('recorded_month', { ascending: false });
        if (error) throw error;
        return data;
    }, [supabase]);

    const fetchAllResourceRecords = useCallback(async () => {
        const { data, error } = await supabase
            .from('resource_records')
            .select('*')
            .eq('company_id', companyId)
            .order('recorded_month', { ascending: false });
        if (error) throw error;
        return data;
    }, [supabase, companyId]);

    const generateKpiCsvTemplate = async () => {
        setLoading(true);
        try {
            const [depts, kpis] = await Promise.all([
                fetchDepartments(),
                fetchKpis()
            ]);

            const kpiIds = kpis.map((k: any) => k.id);
            const records = await fetchAllKpiRecords(kpiIds);

            // DB側は YYYY-MM-01 形式で保存されている月リスト
            const monthsFull = getLastNMonths(13); // ["2025-04-01", "2025-05-01", ...]

            // レコードの recorded_month を正規化するヘルパー
            // (DBに "YYYY-MM" と "YYYY-MM-01" が混在する可能性に対応)
            const normalizeMonth = (m: string) => {
                if (!m) return m;
                if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
                return m;
            };

            // レコードの recorded_month を正規化した高速ルックアップを構築
            const recordMap = new Map<string, any>();
            records.forEach((r: any) => {
                const normMonth = normalizeMonth(r.recorded_month);
                // キー: kpi_id__month__dept_id(またはownerDept)
                // department_id がある場合はそのまま使う
                if (r.department_id) {
                    recordMap.set(`${r.kpi_definition_id}__${normMonth}__${r.department_id}`, r);
                }
                // department_id が無い場合、axis_id も無いメインレコードとして登録
                if (!r.department_id && !r.axis_id) {
                    recordMap.set(`${r.kpi_definition_id}__${normMonth}__main`, r);
                }
            });

            const headers = ['対象月', '部署名', ...kpis.map((k: any) => k.name)];
            const csvRows = [headers.join(',')];

            for (const monthFull of monthsFull) {
                const monthDisplay = monthFull.slice(0, 7); // CSV表示用: "2025-04"
                for (const dept of depts) {
                    const row = [monthDisplay, dept.name];
                    for (const kpi of kpis) {
                        // 1. department_id で直接マッチするレコードを探す
                        let rec = recordMap.get(`${kpi.id}__${monthFull}__${dept.id}`);
                        // 2. 見つからなければ、KPI定義の所属部署 (owner_dept_id) でマッチ
                        if (!rec && kpi.owner_dept_id === dept.id) {
                            rec = recordMap.get(`${kpi.id}__${monthFull}__main`);
                        }
                        row.push(rec ? rec.value.toString() : "");
                    }
                    csvRows.push(row.join(','));
                }
            }
            return csvRows.join('\n');
        } finally {
            setLoading(false);
        }
    };

    const generateResourceCsvTemplate = async () => {
        setLoading(true);
        try {
            const [depts, records] = await Promise.all([
                fetchDepartments(),
                fetchAllResourceRecords()
            ]);

            const monthsFull = getLastNMonths(13); // ["2025-04-01", ...]

            // recorded_monthを正規化してルックアップ構築
            const normalizeMonth = (m: string) => {
                if (!m) return m;
                if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
                return m;
            };
            const recordMap = new Map<string, any>();
            records.forEach((r: any) => {
                const normMonth = normalizeMonth(r.recorded_month);
                recordMap.set(`${r.department_id}__${normMonth}`, r);
            });

            const headers = ['対象月', '部署名', '人数', '人件費'];
            const csvRows = [headers.join(',')];

            for (const monthFull of monthsFull) {
                const monthDisplay = monthFull.slice(0, 7);
                for (const dept of depts) {
                    const rec = recordMap.get(`${dept.id}__${monthFull}`);
                    const row = [
                        monthDisplay, 
                        dept.name, 
                        rec ? rec.head_count.toString() : "", 
                        rec ? (rec.labor_cost?.toString() || "") : ""
                    ];
                    csvRows.push(row.join(','));
                }
            }
            return csvRows.join('\n');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        fetchCompany,
        updateCompany,
        fetchDepartments,
        fetchKpis,
        updateDepartments,
        deleteDepartment,
        updateKpis,
        deleteKpi,
        generateKpiCsvTemplate,
        generateResourceCsvTemplate
    };
}
