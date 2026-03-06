"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/ui/TabBar";
import { Badge } from "@/components/ui/Badge";
import { Save, Plus, Trash2, Star, UserPlus, Mail, Shield, Copy, Check, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { KPI_UNIT_OPTIONS } from "@/lib/constants";

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("company");
    const [loading, setLoading] = useState(true);

    // State
    const [company, setCompany] = useState<any>(null);
    const [depts, setDepts] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("manager");
    const [lastToken, setLastToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // 第2軸用
    const [secondaryAxisName, setSecondaryAxisName] = useState("第2軸");
    const [axes, setAxes] = useState<any[]>([]);

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

        const { data: compRef, error: uErr } = await supabase.from('users').select('company_id').eq('id', user.id).single();
        if (uErr || !compRef?.company_id) {
            router.push("/onboarding");
            return;
        }

        const { data: companyData } = await supabase.from('companies').select('*').eq('id', compRef.company_id).single();
        if (companyData) setCompany(companyData);

        const { data: deptData } = await supabase.from('departments').select('*').eq('company_id', compRef.company_id).order('created_at', { ascending: true });
        if (deptData) setDepts(deptData);

        const { data: kpiData } = await supabase.from('kpi_definitions').select('*').eq('company_id', compRef.company_id).order('sort_order', { ascending: true });
        if (kpiData) {
            const rawKpis = kpiData.map(k => ({ ...k, is_main: !!k.is_main }));
            // 部署ごとに「1つだけ代表」を強制するための正規化
            const deptMainSet = new Set();
            const normalized = rawKpis.map(k => {
                const deptId = k.owner_dept_id || "none";
                if (k.is_main && !deptMainSet.has(deptId)) {
                    deptMainSet.add(deptId);
                    return k;
                }
                return { ...k, is_main: false };
            });

            // 代表が一人もいない部署について、最初のKPIを代表にする
            const finalKpis = normalized.map(k => {
                const deptId = k.owner_dept_id || "none";
                if (!deptMainSet.has(deptId)) {
                    deptMainSet.add(deptId);
                    return { ...k, is_main: true };
                }
                return k;
            });
            setKpis(finalKpis);
        }

        const { data: userData } = await supabase.from('users').select('*').eq('company_id', compRef.company_id);
        if (userData) setUsers(userData);

        const { data: inviteData } = await supabase.from('invitations').select('*').eq('company_id', compRef.company_id).eq('status', 'pending');
        if (inviteData) setInvitations(inviteData);

        // 第2軸情報の取得
        setSecondaryAxisName(companyData.kpi_secondary_axis_name || "第2軸");
        const { data: axisData } = await supabase.from('kpi_axes').select('*').eq('company_id', compRef.company_id).order('sort_order', { ascending: true });
        if (axisData) setAxes(axisData);

        setLoading(false);
    }

    async function handleSaveCompany() {
        if (!company) return;
        const { error } = await supabase.from('companies').update({
            name: company.name,
            website_url: company.website_url,
            kpi_secondary_axis_name: secondaryAxisName
        }).eq('id', company.id);

        if (!error) alert("企業情報を保存しました");
        else alert(`保存に失敗しました: ${error.message}`);
    }

    // --- 一括保存ロジック集 ---

    async function handleSaveAllDepts() {
        setLoading(true);
        try {
            for (const dept of depts) {
                if (dept.id.startsWith("new_")) {
                    await supabase.from('departments').insert({
                        company_id: company.id,
                        name: dept.name,
                        headcount: dept.headcount
                    });
                } else {
                    await supabase.from('departments').update({
                        name: dept.name,
                        headcount: dept.headcount
                    }).eq('id', dept.id);
                }
            }
            alert("部署情報を一括保存しました");
            await loadData();
        } catch (err: any) {
            alert(`保存に失敗しました: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveAllKpis() {
        setLoading(true);
        try {
            for (const kpi of kpis) {
                const payload = {
                    company_id: company.id,
                    name: kpi.name,
                    unit: kpi.unit || "",
                    target_default: kpi.target_default || null,
                    owner_dept_id: kpi.owner_dept_id || null,
                    is_main: kpi.is_main || false
                };

                if (kpi.id.startsWith("new_")) {
                    await supabase.from('kpi_definitions').insert(payload);
                } else {
                    await supabase.from('kpi_definitions').update(payload).eq('id', kpi.id);
                }
            }
            alert("KPI設定を一括保存しました");
            await loadData();
        } catch (err: any) {
            alert(`保存に失敗しました: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveAllAxes() {
        setLoading(true);
        try {
            // 第2軸名の保存
            await supabase.from('companies').update({
                kpi_secondary_axis_name: secondaryAxisName
            }).eq('id', company.id);

            // 各項目の保存
            for (const axis of axes) {
                if (axis.id.startsWith("new_")) {
                    await supabase.from('kpi_axes').insert({
                        company_id: company.id,
                        name: axis.name,
                        sort_order: axes.indexOf(axis)
                    });
                } else {
                    await supabase.from('kpi_axes').update({
                        name: axis.name,
                        sort_order: axes.indexOf(axis)
                    }).eq('id', axis.id);
                }
            }
            alert(`${secondaryAxisName}設定を一括保存しました`);
            await loadData();
        } catch (err: any) {
            alert(`保存に失敗しました: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    // 第2軸（Axis）操作用
    async function handleSaveAxis(axis: any) {
        // 個別保存は一括保存に統合するため削除予定またはラッパー
        handleSaveAllAxes();
    }

    // --- 削除・追加・ユーティリティ関数（復元） ---

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

    async function handleInvite() {
        if (!inviteEmail.trim()) return;
        setLastToken(null);

        const res = await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });

        if (res.ok) {
            const { token } = await res.json();
            setLastToken(token);
            setInviteEmail("");
            loadData();
        } else {
            alert("招待の送信に失敗しました");
        }
    }

    const copyToken = (token: string) => {
        if (typeof window === "undefined") return;
        const url = `${window.location.origin}/onboarding?token=${token}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        const newKpi = {
            id: `new_${Date.now()}`,
            name: "",
            unit: KPI_UNIT_OPTIONS[0],
            target_default: null,
            owner_dept_id: null,
            is_main: false,
            company_id: company?.id
        };
        // その部署（未指定含む）にKPIが1つもなければ、代表にする
        const hasKpisInGroup = kpis.some(k => k.owner_dept_id === null);
        if (!hasKpisInGroup) newKpi.is_main = true;

        setKpis([...kpis, newKpi]);
    }

    function handleToggleMainKpi(targetKpi: any) {
        if (targetKpi.is_main) return;
        setKpis(kpis.map(k => {
            if (k.owner_dept_id === targetKpi.owner_dept_id && k.id !== targetKpi.id) {
                return { ...k, is_main: false };
            }
            if (k.id === targetKpi.id) {
                return { ...k, is_main: true };
            }
            return k;
        }));
    }

    function handleDeptChange(targetKpi: any, newDeptId: string | null) {
        const oldDeptId = targetKpi.owner_dept_id;
        const targetId = targetKpi.id;

        setKpis(prev => {
            let next = prev.map(k => k.id === targetId ? { ...k, owner_dept_id: newDeptId } : k);
            const inNewDept = next.filter(k => k.owner_dept_id === newDeptId);
            const mainsInNew = inNewDept.filter(k => k.is_main);

            if (mainsInNew.length > 1) {
                next = next.map(k => (k.id === targetId && k.is_main) ? { ...k, is_main: false } : k);
            } else if (inNewDept.length > 0 && mainsInNew.length === 0) {
                next = next.map(k => k.id === inNewDept[0].id ? { ...k, is_main: true } : k);
            }

            const inOldDept = next.filter(k => k.owner_dept_id === oldDeptId);
            const mainsInOld = inOldDept.filter(k => k.is_main);

            if (inOldDept.length > 0 && mainsInOld.length === 0) {
                next = next.map(k => k.id === inOldDept[0].id ? { ...k, is_main: true } : k);
            }
            return next;
        });
    }

    async function handleDeleteAxis(id: string) {
        if (id.startsWith("new_")) {
            setAxes(axes.filter(a => a.id !== id));
            return;
        }
        if (confirm(`この${secondaryAxisName}を削除しますか？関連するKPI実績データも削除されます。`)) {
            await supabase.from('kpi_axes').delete().eq('id', id);
            loadData();
        }
    }

    function handleAddAxis() {
        setAxes([...axes, { id: `new_${Date.now()}`, name: "", company_id: company?.id }]);
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
                        { id: "kpi", label: "🎯 KPI設定" },
                        { id: "axis", label: `🏷️ ${secondaryAxisName}設定` },
                        { id: "users", label: "👤 ユーザー管理" }
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
                        {company?.error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                                ⚠️ {company.error}
                            </div>
                        )}

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
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Webサイト URL</label>
                                            <input
                                                type="url"
                                                value={company.website_url || ""}
                                                placeholder="https://example.com"
                                                onChange={(e) => setCompany({ ...company, website_url: e.target.value })}
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
                                                    onClick={() => handleDeleteDept(dept.id)}
                                                    className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleAddDept}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-teal hover:text-teal hover:bg-teal/5 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> 新しい部署を追加
                                    </button>

                                    {depts.length > 0 && (
                                        <button
                                            onClick={handleSaveAllDepts}
                                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-200"
                                        >
                                            <Save className="w-4 h-4" /> 部署の設定をすべて保存
                                        </button>
                                    )}
                                </div>
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
                                                        {KPI_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end mt-1">
                                                <div className="sm:col-span-6">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">主担当部署 (任意)</label>
                                                    <select
                                                        value={kpi.owner_dept_id || ""}
                                                        onChange={(e) => handleDeptChange(kpi, e.target.value || null)}
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
                                <div className="space-y-3">
                                    <button
                                        onClick={handleAddKpi}
                                        className="w-full py-4 mt-2 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-teal hover:text-teal hover:bg-teal/5 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> 新しいKPIを追加
                                    </button>

                                    {kpis.length > 0 && (
                                        <button
                                            onClick={handleSaveAllKpis}
                                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-200"
                                        >
                                            <Save className="w-4 h-4" /> KPI設定をすべて保存
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 第2軸設定 */}
                        {activeTab === "axis" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="mb-6 space-y-4">
                                    <h2 className="text-lg font-bold text-slate-800 mb-2">第2軸の設定</h2>

                                    <div className="max-w-md p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">第2軸の呼称（プロダクト、地域など）</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={secondaryAxisName}
                                                placeholder="例: プロダクト"
                                                onChange={(e) => setSecondaryAxisName(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                                            />
                                            <button
                                                onClick={handleSaveCompany}
                                                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                                            >
                                                <Save className="w-3.5 h-3.5" /> 保存
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 ml-1">※ KPI入力画面でのセクションタイトルに使用されます。</p>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">{secondaryAxisName}の項目管理</h3>
                                        <p className="text-xs text-slate-500">
                                            独自の切り口を設定できます。例えば、{secondaryAxisName === "第2軸" ? "プロダクト、エリア、支店" : secondaryAxisName}の名前を登録してください。
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {axes.map((axis) => (
                                        <div key={axis.id} className="flex gap-3 items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/50">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={axis.name}
                                                    placeholder={`${secondaryAxisName}の名前を入力...`}
                                                    onChange={(e) => setAxes(axes.map(a => a.id === axis.id ? { ...a, name: e.target.value } : a))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:border-teal outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDeleteAxis(axis.id)}
                                                    className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleAddAxis}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-teal hover:text-teal hover:bg-teal/5 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> 新しい{secondaryAxisName}を追加
                                    </button>

                                    {(axes.length > 0 || secondaryAxisName !== company?.kpi_secondary_axis_name) && (
                                        <button
                                            onClick={handleSaveAllAxes}
                                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-200"
                                        >
                                            <Save className="w-4 h-4" /> {secondaryAxisName}設定をすべて保存
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ユーザー管理 */}
                        {activeTab === "users" && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-teal" /> メンバーを招待
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">メールアドレス</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="example@company.com"
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:w-40">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">権限ロール</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <select
                                                    value={inviteRole}
                                                    onChange={(e) => setInviteRole(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:border-teal outline-none appearance-none"
                                                >
                                                    <option value="admin">管理者</option>
                                                    <option value="manager">マネージャー</option>
                                                    <option value="player">一般</option>
                                                    <option value="partner">パートナー</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleInvite}
                                            className="sm:self-end px-6 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold shadow-md hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            招待リンクを発行
                                        </button>
                                    </div>

                                    {lastToken && (
                                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-2">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-emerald-700">招待用リンクが発行されました:</span>
                                                    <button
                                                        onClick={() => copyToken(lastToken)}
                                                        className="flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
                                                    >
                                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                        {copied ? "コピーしました！" : "URLをコピー"}
                                                    </button>
                                                </div>
                                                <code className="text-[10px] break-all bg-white/50 p-2 rounded-lg border border-emerald-100 text-slate-600">
                                                    {window.location.origin}/onboarding?token={lastToken}
                                                </code>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">現在のメンバー</h2>
                                    <div className="grid gap-3">
                                        {users.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-sm transition-all duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 font-black text-sm">
                                                        {(u.display_name || u.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{u.display_name || "名称未設定"}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">{u.email}</div>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[10px] px-2.5 py-1 uppercase tracking-tight",
                                                    u.role === "admin" || u.role === "executive" ? "bg-amber-100 text-amber-600" :
                                                        u.role === "partner" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                                                )}>
                                                    {u.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {invitations.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">招待中</h2>
                                        <div className="grid gap-3 opacity-70">
                                            {invitations.map((inv) => (
                                                <div key={inv.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl border-dashed">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm italic">
                                                            ?
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-600">{inv.email}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold">期限: {new Date(inv.expires_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Badge className="text-[10px] bg-slate-100 text-slate-400 border-none px-2.5 py-1 uppercase">
                                                            {inv.role}
                                                        </Badge>
                                                        <button
                                                            onClick={() => copyToken(inv.token)}
                                                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                                                            title="リンクを再コピー"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
