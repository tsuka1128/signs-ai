"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import {
    Settings2,
    Building2,
    Users,
    Target,
    Layers,
    Save,
    Plus,
    Trash2,
    Star,
    Mail,
    UserPlus,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
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
    const [axes, setAxes] = useState<any[]>([]);
    const [secondaryAxisName, setSecondaryAxisName] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Get company_id
            const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single();
            if (!userData?.company_id) return;

            // Load data in parallel
            const [comp, d, k, a, u, i] = await Promise.all([
                supabase.from('companies').select('*').eq('id', userData.company_id).single(),
                supabase.from('departments').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('kpi_definitions').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('kpi_axes').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('users').select('*').eq('company_id', userData.company_id),
                supabase.from('invitations').select('*').eq('company_id', userData.company_id).eq('status', 'pending')
            ]);

            if (comp.data) {
                setCompany(comp.data);
                setSecondaryAxisName(comp.data.secondary_axis_name || "プロダクト");
            }
            if (d.data) setDepts(d.data);
            if (k.data) setKpis(k.data);
            if (a.data) setAxes(a.data);
            if (u.data) setUsers(u.data);
            if (i.data) setInvitations(i.data);
            setLoading(false);
        }
        loadSettings();
    }, [router]);

    // Handlers
    const handleSaveCompany = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('companies').update({
            name: company.name,
            secondary_axis_name: secondaryAxisName,
            secondary_axis_size_kpi_id: company.secondary_axis_size_kpi_id
        }).eq('id', company.id);

        if (!error) alert("企業情報を保存しました");
        else alert(`保存に失敗しました: ${error.message}`);
    };

    const handleAddDept = () => {
        setDepts([...depts, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSaveAllDepts = async () => {
        const supabase = createClient();
        try {
            const toUpdate = depts.filter(d => !d.is_new).map((d, index) => ({ ...d, sort_order: index }));
            const toCreate = depts.filter(d => d.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = depts.filter(d => !d.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(d => supabase.from('departments').update({ name: d.name, headcount: d.headcount, sort_order: d.sort_order }).eq('id', d.id)),
                toCreate.length > 0 ? supabase.from('departments').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = results.find(r => r.error)?.error;
            if (firstError) {
                console.error("Depts save error:", firstError);
                throw new Error(firstError.message);
            }

            alert("部署情報を一括保存しました");
            const { data } = await supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setDepts(data);
        } catch (err: any) {
            console.error("Depts save failed:", err);
            alert(`部署情報の保存に失敗しました: ${err.message || "詳細不明"}`);
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (!confirm("この部署を削除しますか？")) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('departments').delete().eq('id', id);
        }
        setDepts(depts.filter(d => d.id !== id));
    };

    const handleAddKpi = () => {
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "", target_default: 0, is_main: false, is_new: true }]);
    };

    const handleSaveAllKpis = async () => {
        const supabase = createClient();
        try {
            const toUpdate = kpis.filter(k => !k.is_new).map((k, index) => ({ ...k, sort_order: index }));
            const toCreate = kpis.filter(k => k.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = kpis.filter(k => !k.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(k => supabase.from('kpi_definitions').update({
                    name: k.name,
                    unit: k.unit,
                    target_default: k.target_default,
                    is_main: k.is_main,
                    owner_dept_id: k.owner_dept_id,
                    sort_order: k.sort_order
                }).eq('id', k.id)),
                toCreate.length > 0 ? supabase.from('kpi_definitions').insert(toCreate.map(k => ({
                    ...k,
                    target_default: k.target_default ?? 0
                }))) : Promise.resolve({ error: null })
            ]);

            const firstError = results.find(r => r.error)?.error;
            if (firstError) {
                console.error("KPIs save error:", firstError);
                throw new Error(firstError.message);
            }

            alert("KPI設定を一括保存しました");
            const { data } = await supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setKpis(data);
        } catch (err: any) {
            console.error("KPIs save failed:", err);
            alert(`KPI設定の保存に失敗しました: ${err.message || "詳細不明"}`);
        }
    };

    const handleSaveSingleKpi = async (k: any) => {
        const supabase = createClient();
        try {
            const dataToSave = {
                name: k.name,
                unit: k.unit,
                target_default: k.target_default,
                is_main: k.is_main,
                owner_dept_id: k.owner_dept_id || null,
                company_id: company.id
            };

            let error;
            if (k.is_new) {
                // Determine sort order
                const sortOrder = kpis.length - 1;
                const { id, is_new, ...insertData } = k;
                const { data, error: err } = await supabase.from('kpi_definitions').insert({
                    ...insertData,
                    company_id: company.id,
                    sort_order: sortOrder
                }).select().single();
                error = err;
                if (data) {
                    setKpis(kpis.map(x => x.id === k.id ? { ...data, is_new: false } : x));
                }
            } else {
                const { error: err } = await supabase.from('kpi_definitions').update(dataToSave).eq('id', k.id);
                error = err;
            }

            if (error) throw error;
            alert(`${k.name || "KPI"}を保存しました`);
        } catch (err: any) {
            console.error("KPI save failed:", err);
            alert(`保存に失敗しました: ${err.message}`);
        }
    };

    const handleDeleteKpi = async (id: string) => {
        if (!confirm("このKPIを削除しますか？")) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('kpi_definitions').delete().eq('id', id);
        }
        setKpis(kpis.filter(k => k.id !== id));
    };

    const handleAddAxis = () => {
        setAxes([...axes, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSaveAllAxes = async () => {
        const supabase = createClient();

        try {
            // 1. 公司設定の保存 (バブルサイズKPI含む)
            // secondary_axis_name や secondary_axis_size_kpi_id がキャッシュエラーで失敗する場合があるため、個別にエラーハンドリング
            const { error: companyError } = await supabase.from('companies').update({
                secondary_axis_name: secondaryAxisName,
                secondary_axis_size_kpi_id: company.secondary_axis_size_kpi_id || null
            }).eq('id', company.id);

            if (companyError) {
                console.warn("Company fields update warning (schema cache issue?):", companyError.message);
                // 致命的エラーとはせず続行を検討（軸項目の保存を優先するため）、
                // ただしユーザーには警告を表示
            }

            // 2. 軸項目の保存
            const toUpdate = axes.filter(a => !a.is_new).map((a, index) => ({ ...a, sort_order: index }));
            const toCreate = axes.filter(a => a.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = axes.filter(a => !a.is_new).length;
                return { ...rest, company_id: (company as any).id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(a => supabase.from('kpi_axes').update({ name: a.name, headcount: a.headcount, sort_order: a.sort_order }).eq('id', a.id)),
                toCreate.length > 0 ? supabase.from('kpi_axes').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = results.find(r => r.error)?.error;
            if (firstError) {
                console.error("Axes save error:", firstError);
                throw new Error(`${secondaryAxisName}の保存に失敗: ${firstError.message}`);
            }

            alert(`${secondaryAxisName}設定を一括保存しました`);
            const { data } = await supabase.from('kpi_axes').select('*').eq('company_id', (company as any).id).order('sort_order', { ascending: true });
            if (data) setAxes(data);
        } catch (err: any) {
            console.error("Save failed:", err);
            alert(`保存に失敗しました: ${err.message || "詳細不明のエラー"}`);
        }
    };

    const handleDeleteAxis = async (id: string) => {
        if (!confirm(`この${secondaryAxisName}を削除しますか？`)) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('kpi_axes').delete().eq('id', id);
        }
        setAxes(axes.filter(a => a.id !== id));
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        const supabase = createClient();
        const { error } = await supabase.from('invitations').insert({
            email: inviteEmail,
            company_id: company.id,
            role: 'member'
        });

        if (!error) {
            alert("招待を送信しました");
            setInviteEmail("");
            const { data } = await supabase.from('invitations').select('*').eq('company_id', company.id).eq('status', 'pending');
            if (data) setInvitations(data);
        } else {
            alert(`招待に失敗しました: ${error.message}`);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            <Settings2 className="w-8 h-8 text-teal" />
                            設定 <span className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-bold ml-2 tracking-normal">v2.1 Sync</span>
                        </h1>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">組織構成と指標のカスタマイズ</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: "company", icon: Building2, label: "基本設定" },
                        { id: "dept", icon: Users, label: "部署" },
                        { id: "kpi", icon: Target, label: "KPI" },
                        { id: "axis", icon: Layers, label: "第2軸" },
                        { id: "users", icon: UserPlus, label: "メンバー" }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeTab === t.id ? "bg-white text-teal shadow-md" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Cards */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    {activeTab === "company" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-teal" /> 企業基本情報
                                </h2>
                                <div className="space-y-6 max-w-xl">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">企業名</label>
                                        <input
                                            type="text"
                                            value={company?.name || ""}
                                            onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveCompany}
                                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                                    >
                                        <Save className="w-4 h-4" /> 企業情報を保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "dept" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-teal" /> 部署管理
                                </h2>
                                <p className="text-xs text-slate-500 mb-6">組織内の各部署を登録してください。バブルチャートの比較に使用されます。</p>

                                <div className="space-y-4">
                                    {depts.map(d => (
                                        <div key={d.id} className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">部署名</label>
                                                <input
                                                    type="text"
                                                    value={d.name}
                                                    onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={d.headcount === 0 ? "" : d.headcount}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                            setDepts(depts.map(x => x.id === d.id ? { ...x, headcount: val } : x));
                                                        }}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteDept(d.id)}
                                                className="p-3 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all self-end"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddDept} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 新しい部署を追加
                                        </button>
                                        <button onClick={handleSaveAllDepts} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> 部署の設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "kpi" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-teal" /> KPI設定
                                </h2>
                                <p className="text-xs text-slate-500 mb-6">各部署の重要指標を定義します。生産性スコアの基盤となります。</p>

                                <div className="space-y-4">
                                    {kpis.map(k => (
                                        <div key={k.id} className="p-7 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-6 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                                            {/* Row 1: KPI Name, Target, Unit */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">指標名</label>
                                                    <input
                                                        type="text"
                                                        value={k.name}
                                                        placeholder="指標名を入力"
                                                        onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">目標値</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={k.target_default ?? 0}
                                                        placeholder="目標額/数"
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? "" : Number(e.target.value);
                                                            setKpis(kpis.map(x => x.id === k.id ? { ...x, target_default: val } : x));
                                                        }}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">単位</label>
                                                    <div className="relative">
                                                        <select
                                                            value={k.unit}
                                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, unit: e.target.value } : x))}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all"
                                                        >
                                                            <option value="">単位を選択</option>
                                                            {KPI_UNIT_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 2: Dept, Main Toggle, Save, Delete */}
                                            <div className="grid grid-cols-1 md:grid-cols-10 gap-5 items-end">
                                                <div className="md:col-span-4">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">主担当部署（任意）</label>
                                                    <div className="relative">
                                                        <select
                                                            value={k.owner_dept_id || ""}
                                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, owner_dept_id: e.target.value } : x))}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all"
                                                        >
                                                            <option value="">設定なし</option>
                                                            {depts.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">部署代表KPI設定</label>
                                                    <button
                                                        onClick={() => {
                                                            const isCurrentlyMain = k.is_main;
                                                            const deptId = k.owner_dept_id;
                                                            setKpis(kpis.map(x => {
                                                                if (deptId && x.owner_dept_id === deptId && x.id !== k.id) return { ...x, is_main: false };
                                                                if (x.id === k.id) return { ...x, is_main: !isCurrentlyMain };
                                                                return x;
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm",
                                                            k.is_main
                                                                ? "bg-teal/5 border-teal text-teal"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <Star className={cn("w-4 h-4", k.is_main ? "fill-teal" : "text-slate-300")} />
                                                        <span>{k.is_main ? "設定済み" : "設定する"}</span>
                                                    </button>
                                                </div>

                                                <div className="md:col-span-3 flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveSingleKpi(k)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        <span>保存</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteKpi(k.id)}
                                                        className="p-3.5 rounded-2xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddKpi} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 指標を追加
                                        </button>
                                        <button onClick={handleSaveAllKpis} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> KPI設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "axis" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-teal" /> 第2軸の設定（プロダクト・地域など）
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">軸の呼称</label>
                                        <input
                                            type="text"
                                            value={secondaryAxisName}
                                            placeholder="例: プロダクト"
                                            onChange={(e) => setSecondaryAxisName(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ 「KPI入力」や「マトリックス切替」の名称として使用されます。</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">バブルサイズのKPI</label>
                                        <select
                                            value={company?.secondary_axis_size_kpi_id || ""}
                                            onChange={(e) => setCompany({ ...company, secondary_axis_size_kpi_id: e.target.value || null })}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                        >
                                            <option value="">-- 指定なし（達成率を使用） --</option>
                                            {kpis.map(k => (
                                                <option key={k.id} value={k.id}>{k.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ マトリックスの円の大きさに反映させる重要指標を選択してください。</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 ml-1">{secondaryAxisName}の項目一覧</h3>
                                    {axes.map(a => (
                                        <div key={a.id} className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">{secondaryAxisName}名</label>
                                                <input
                                                    type="text"
                                                    value={a.name}
                                                    onChange={(e) => setAxes(axes.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={a.headcount === 0 ? "" : a.headcount}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                            setAxes(axes.map(x => x.id === a.id ? { ...x, headcount: val } : x));
                                                        }}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAxis(a.id)}
                                                className="p-3 rounded-xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all self-end"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddAxis} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 新しい{secondaryAxisName}を追加
                                        </button>
                                        <button onClick={handleSaveAllAxes} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> {secondaryAxisName}設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="space-y-10 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-teal" /> メンバーを招待
                                </h2>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                                    <div className="max-w-md">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">メールアドレス</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="example@company.com"
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-11 py-4 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                />
                                            </div>
                                            <button
                                                onClick={handleInvite}
                                                className="bg-teal text-white px-6 rounded-2xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal/10 flex items-center gap-2"
                                            >
                                                招待送信 <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-teal" /> 登録済みメンバー
                                </h2>
                                <div className="space-y-3">
                                    {users.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                    {(u.email || "U")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{u.email}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{u.role === 'admin' ? '管理者' : '一般メンバー'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {invitations.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 border-dashed rounded-2xl opacity-70">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 font-black text-xs">
                                                    {(inv.email || "I")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500">{inv.email}</div>
                                                    <div className="text-[10px] text-teal-500 font-bold uppercase">招待中 (有効期限お待ち)</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
