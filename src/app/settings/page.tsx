"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/ui/TabBar";
import { Badge } from "@/components/ui/Badge";
import { Save, Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("company");
    const [loading, setLoading] = useState(true);

    // State
    const [company, setCompany] = useState<any>(null);
    const [depts, setDepts] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: compRef } = await supabase.from('users').select('company_id').eq('id', user.id).single();
        if (!compRef?.company_id) {
            setLoading(false);
            return;
        }

        const { data: companyData } = await supabase.from('companies').select('*').eq('id', compRef.company_id).single();
        if (companyData) setCompany(companyData);

        const { data: deptData } = await supabase.from('departments').select('*').eq('company_id', compRef.company_id).order('created_at', { ascending: true });
        if (deptData) setDepts(deptData);

        const { data: kpiData } = await supabase.from('kpi_definitions').select('*').eq('company_id', compRef.company_id).order('sort_order', { ascending: true });
        if (kpiData) setKpis(kpiData.map(k => ({ ...k, is_main: !!k.is_main })));

        setLoading(false);
    }

    async function handleSaveCompany() {
        if (!company) return;
        await supabase.from('companies').update({ name: company.name }).eq('id', company.id);
        alert("企業情報を保存しました");
    }

    async function handleSaveDept(dept: any) {
        if (dept.id.startsWith("new_")) {
            const { error } = await supabase.from('departments').insert({
                company_id: company.id,
                name: dept.name,
                headcount: dept.headcount
            });
            if (!error) loadData();
            else alert("追加に失敗しました");
        } else {
            const { error } = await supabase.from('departments').update({
                name: dept.name,
                headcount: dept.headcount
            }).eq('id', dept.id);
            if (!error) alert("部署情報を更新しました");
            else alert("更新に失敗しました");
        }
    }

    async function handleDeleteDept(id: string) {
        if (id.startsWith("new_")) {
            setDepts(depts.filter(d => d.id !== id));
            return;
        }
        if (confirm("本当に削除しますか？")) {
            await supabase.from('departments').delete().eq('id', id);
            loadData();
        }
    }

    function handleAddDept() {
        setDepts([...depts, { id: `new_${Date.now()}`, name: "", headcount: 0, company_id: company?.id }]);
    }

    async function handleSaveKpi(kpi: any) {
        if (kpi.id.startsWith("new_")) {
            const { error } = await supabase.from('kpi_definitions').insert({
                company_id: company.id,
                name: kpi.name,
                unit: kpi.unit || "",
                target_default: kpi.target_default || null,
                owner_dept_id: kpi.owner_dept_id || null,
                is_main: kpi.is_main || false
            });
            if (!error) loadData();
            else alert("追加に失敗しました");
        } else {
            const { error } = await supabase.from('kpi_definitions').update({
                name: kpi.name,
                unit: kpi.unit || "",
                target_default: kpi.target_default || null,
                owner_dept_id: kpi.owner_dept_id || null,
                is_main: kpi.is_main || false
            }).eq('id', kpi.id);
            if (!error) {
                // 代表KPIとして保存された場合、同一部署の他のKPIは代表から外す
                if (kpi.is_main && kpi.owner_dept_id) {
                    await supabase.from('kpi_definitions')
                        .update({ is_main: false })
                        .eq('company_id', company.id)
                        .eq('owner_dept_id', kpi.owner_dept_id)
                        .neq('id', kpi.id);
                }
                alert("KPI設定を更新しました");
                loadData(); // 状態を再同期
            }
            else alert("更新に失敗しました");
        }
    }

    async function handleDeleteKpi(id: string) {
        if (id.startsWith("new_")) {
            setKpis(kpis.filter(k => k.id !== id));
            return;
        }
        if (confirm("本当に削除しますか？実データも削除される可能性があります。")) {
            await supabase.from('kpi_definitions').delete().eq('id', id);
            loadData();
        }
    }

    function handleAddKpi() {
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "", target_default: null, owner_dept_id: null, is_main: false, company_id: company?.id }]);
    }

    function handleToggleMainKpi(targetKpi: any) {
        setKpis(kpis.map(k => {
            // 同じ部署の他のKPIの代表フラグを折る
            if (k.owner_dept_id === targetKpi.owner_dept_id && k.id !== targetKpi.id) {
                return { ...k, is_main: false };
            }
            // ターゲット自身をトグル
            if (k.id === targetKpi.id) {
                return { ...k, is_main: !k.is_main };
            }
            return k;
        }));
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />

            <main className="max-w-3xl mx-auto px-5 py-8 space-y-8 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">組織情報</h1>
                    <Badge className="bg-slate-200 text-slate-500 border-none ml-2">管理者専用</Badge>
                </div>

                <TabBar
                    tabs={[
                        { id: "company", label: "🏢 企業情報" },
                        { id: "dept", label: "👥 部署管理" },
                        { id: "kpi", label: "🎯 KPI設定" }
                    ]}
                    active={activeTab}
                    onChange={setActiveTab}
                />

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <span className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin"></span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm transition-all duration-300">

                        {/* 企業情報 */}
                        {activeTab === "company" && company && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 mb-4">基本情報</h2>
                                    <div className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">企業名</label>
                                            <input
                                                type="text"
                                                value={company.name}
                                                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:border-teal/30 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveCompany}
                                            className="px-6 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> 変更を保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 部署管理 */}
                        {activeTab === "dept" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-slate-800">登録されている部署</h2>
                                </div>

                                <div className="space-y-3">
                                    {depts.map((dept) => (
                                        <div key={dept.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/50">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 sm:hidden">部署名</label>
                                                    <input
                                                        type="text"
                                                        value={dept.name}
                                                        placeholder="例: 営業第一部"
                                                        onChange={(e) => setDepts(depts.map(d => d.id === dept.id ? { ...d, name: e.target.value } : d))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 sm:hidden">人数</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={dept.headcount}
                                                            onChange={(e) => setDepts(depts.map(d => d.id === dept.id ? { ...d, headcount: parseInt(e.target.value) || 0 } : d))}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">名</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                                <button
                                                    onClick={() => handleSaveDept(dept)}
                                                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal hover:bg-teal/5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                                >
                                                    <Save className="w-3.5 h-3.5" /> 保存
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDept(dept.id)}
                                                    className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddDept}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-teal hover:text-teal hover:bg-teal/5 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> 新しい部署を追加
                                </button>
                            </div>
                        )}

                        {/* KPI管理 */}
                        {activeTab === "kpi" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-slate-800">登録されているKPI</h2>
                                </div>

                                <div className="space-y-4">
                                    {kpis.map((kpi) => (
                                        <div key={kpi.id} className="flex flex-col gap-3 p-5 bg-slate-50 border border-slate-100 rounded-3xl transition-all hover:bg-slate-100/50">
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                <div className="sm:col-span-5">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">指標名</label>
                                                    <input
                                                        type="text"
                                                        value={kpi.name}
                                                        placeholder="例: MRR, リード獲得数"
                                                        onChange={(e) => setKpis(kpis.map(k => k.id === kpi.id ? { ...k, name: e.target.value } : k))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none"
                                                    />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">目標値</label>
                                                    <input
                                                        type="number"
                                                        value={kpi.target_default || ''}
                                                        placeholder="例: 1000"
                                                        onChange={(e) => setKpis(kpis.map(k => k.id === kpi.id ? { ...k, target_default: parseInt(e.target.value) || null } : k))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none"
                                                    />
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">単位</label>
                                                    <select
                                                        value={kpi.unit}
                                                        onChange={(e) => setKpis(kpis.map(k => k.id === kpi.id ? { ...k, unit: e.target.value } : k))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none appearance-none"
                                                    >
                                                        <option value="">単位を選択</option>
                                                        <option value="円">円</option>
                                                        <option value="件">件</option>
                                                        <option value="%">%</option>
                                                        <option value="pt">pt</option>
                                                        <option value="名">名</option>
                                                        <option value="時間">時間</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end mt-1">
                                                <div className="sm:col-span-6">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">主担当部署 (任意)</label>
                                                    <select
                                                        value={kpi.owner_dept_id || ""}
                                                        onChange={(e) => setKpis(kpis.map(k => k.id === kpi.id ? { ...k, owner_dept_id: e.target.value || null } : k))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none"
                                                    >
                                                        <option value="">-- 指定なし --</option>
                                                        {depts.map(d => !d.id.startsWith("new_") && (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">代表設定</label>
                                                    <button
                                                        onClick={() => handleToggleMainKpi(kpi)}
                                                        className={cn(
                                                            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all font-bold text-xs",
                                                            kpi.is_main
                                                                ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <Star className={cn("w-3.5 h-3.5", kpi.is_main ? "fill-amber-500" : "")} />
                                                        {kpi.is_main ? "代表KPI" : "設定する"}
                                                    </button>
                                                </div>
                                                <div className="sm:col-span-3 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleSaveKpi(kpi)}
                                                        className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal hover:bg-teal/5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                                    >
                                                        <Save className="w-3.5 h-3.5" /> 保存
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteKpi(kpi.id)}
                                                        className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddKpi}
                                    className="w-full py-4 mt-2 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-teal hover:text-teal hover:bg-teal/5 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> 新しいKPIを追加
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </main>
        </div>
    );
}
