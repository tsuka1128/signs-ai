"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Info, Save, ArrowLeft, Building2, Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase";

// KPI定義の型
interface KpiDefinition {
    id: string;
    name: string;
    unit: string;
    owner_dept_id: string | null;
    owner_dept_name?: string;
}

// KPI実績の型
interface KpiRecord {
    kpi_definition_id: string;
    recorded_month: string;
    value: number;
    target_value: number | null;
}

export default function KpiInputPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [kpiDefinitions, setKpiDefinitions] = useState<KpiDefinition[]>([]);
    const [allMonths, setAllMonths] = useState<{ month: string, label: string }[]>([]);
    const [editValues, setEditValues] = useState<Record<string, { value: string, target: string }>>({}); // key: month_kpiId
    const [isLocked, setIsLocked] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            setLoading(false);
            return;
        }
        setUser(authUser);

        // 1. 直近12ヶ月分（今月 + 過去11ヶ月）の月リストを生成
        const months: { month: string, label: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const monthStr = `${yyyy}-${mm}`;
            months.push({
                month: monthStr,
                label: i === 0 ? "今月度" : `${yyyy} / ${mm}`
            });
        }
        setAllMonths(months);

        // 2. ユーザーの所属企業情報を取得してKPI定義を取得
        const { data: userData } = await supabase
            .from('users')
            .select('company_id')
            .eq('id', authUser.id)
            .single();

        if (userData?.company_id) {
            // KPI定義取得（部署名付き）
            const { data: kpis } = await supabase
                .from('kpi_definitions')
                .select('id, name, unit, owner_dept_id, departments(name)')
                .eq('company_id', userData.company_id)
                .order('sort_order', { ascending: true });

            const formattedKpis = (kpis || []).map((k: any) => ({
                id: k.id,
                name: k.name,
                unit: k.unit,
                owner_dept_id: k.owner_dept_id,
                owner_dept_name: k.departments?.name || "未設定"
            }));
            setKpiDefinitions(formattedKpis);

            // 直近7ヶ月分のレコード取得
            const monthList = months.map(m => m.month);
            const { data: recs } = await supabase
                .from('kpi_records')
                .select('*')
                .in('recorded_month', monthList)
                .in('kpi_definition_id', formattedKpis.map(k => k.id));

            const initialEditValues: Record<string, { value: string, target: string }> = {};

            // 全ての組み合わせを空文字で初期化
            formattedKpis.forEach(kpi => {
                monthList.forEach(month => {
                    initialEditValues[`${month}_${kpi.id}`] = { value: "", target: "" };
                });
            });

            // 既存データで上書き
            recs?.forEach(r => {
                initialEditValues[`${r.recorded_month}_${r.kpi_definition_id}`] = {
                    value: String(r.value),
                    target: r.target_value !== null ? String(r.target_value) : ""
                };
            });

            setEditValues(initialEditValues);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user || kpiDefinitions.length === 0) return;
        setIsSaving(true);

        const upsertData: any[] = [];
        Object.entries(editValues).forEach(([key, data]) => {
            const [month, kpiId] = key.split('_');
            if (data.value !== "" || data.target !== "") {
                upsertData.push({
                    kpi_definition_id: kpiId,
                    recorded_month: month,
                    value: Number(data.value || 0),
                    target_value: data.target !== "" ? Number(data.target) : null
                });
            }
        });

        if (upsertData.length === 0) {
            setIsSaving(false);
            return;
        }

        const { error } = await supabase
            .from('kpi_records')
            .upsert(upsertData, { onConflict: 'kpi_definition_id, recorded_month' });

        if (error) {
            console.error("Save error:", error);
            alert("保存に失敗しました。");
        } else {
            setIsSaved(true);
            setIsLocked(true); // 保存後はロックする
            setTimeout(() => setIsSaved(false), 3000);
            fetchInitialData();
        }
        setIsSaving(false);
    };

    const handleInputChange = (month: string, kpiId: string, field: 'value' | 'target', val: string) => {
        setEditValues(prev => ({
            ...prev,
            [`${month}_${kpiId}`]: {
                ...prev[`${month}_${kpiId}`],
                [field]: val
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold mb-4">ログインが必要です</h1>
                <Link href="/login" className="px-6 py-2 bg-teal text-white rounded-lg">ログイン画面へ</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">
            <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 w-full">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3">
                            <ArrowLeft className="w-3 h-3" />
                            ダッシュボードに戻る
                        </Link>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2 flex items-center gap-3">
                            月次KPI一括入力
                            <Badge className="bg-teal/10 text-teal border-none text-[10px] font-bold px-2">管理者向け</Badge>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl">
                            全社のKPIの実績と目標を入力します。過去6ヶ月の実績を振り返りながら入力が可能です。
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 mt-4 sm:mt-0">
                        {/* Sheets連携設定ボタン (デモ版準拠) */}
                        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
                            </svg>
                            Sheets連携設定
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm ${isSaved
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-teal hover:bg-teal/90 text-white hover:shadow-md hover:scale-[1.02]"
                                }`}
                        >
                            {isSaved ? "保存しました" : isSaving ? "保存中..." : "この内容で保存する"}
                            <Save className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-800 overflow-hidden relative mx-auto w-full rounded-[16px]">
                    <div className={`px-5 py-4 bg-slate-800 text-white border-b border-slate-700 flex items-center justify-between`}>
                        <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-teal-400" />
                            <h2 className="text-sm font-black tracking-tight">全社・部署（基本）</h2>
                            <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] px-2 py-0 uppercase tracking-tighter">Main</Badge>
                        </div>

                        {/* ロック状態切り替え（アイコンクリックで操作） */}
                        <button
                            onClick={() => setIsLocked(!isLocked)}
                            className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors group"
                        >
                            {isLocked ? (
                                <>
                                    <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
                                    <span className="text-slate-400 group-hover:text-slate-300">今月度のみ入力可能</span>
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                                    <span className="text-teal-400">過去実績の編集モード有効</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse table-layout-fixed" style={{ minWidth: "2500px" }}>
                            <thead>
                                <tr>
                                    {/* 1. KPI Name (Sticky Left 0) - Width: 220px */}
                                    <th className="sticky left-0 top-0 z-40 w-[220px] min-w-[220px] bg-white border-b border-r border-slate-200 p-3 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">項目名 / 部署</span>
                                    </th>

                                    {/* All Months as headers - PC 200px */}
                                    {allMonths.map((m, idx) => (
                                        <th key={m.month}
                                            className={`sticky top-0 z-40 w-[200px] min-w-[200px] border-b border-r border-slate-200 p-2 text-center transition-colors ${idx === 0
                                                ? "left-[220px] bg-[#F0FDF4] shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)] z-50 border-r-2 border-slate-200"
                                                : "bg-slate-50"
                                                }`}>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className={`text-[12px] font-black tracking-tighter ${idx === 0 ? "text-teal-900" : "text-slate-500"}`}>{m.label}</div>
                                                {idx === 0 && <span className="text-[8px] font-black text-teal-500 bg-teal/10 px-1.5 py-0.5 rounded leading-none">INPUT</span>}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="bg-slate-50 border-b border-slate-200 w-full min-w-[100px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {kpiDefinitions.map((kpi, index) => (
                                    <tr key={kpi.id} className="group border-b border-slate-200 bg-white">
                                        {/* 1. KPI Name (Sticky Left 0) */}
                                        <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 p-0 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors align-top w-[220px]">
                                            <div className="flex flex-col h-full justify-between p-3 min-h-[90px]">
                                                <div className="flex items-start gap-2 mb-2 ml-1">
                                                    <span className="text-[10px] font-black text-slate-300 mt-0.5">{index + 1}.</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold text-slate-800 leading-none mb-1">{kpi.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">{kpi.owner_dept_name}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 font-bold pr-1.5">{kpi.unit}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* All Months data cells - PC 200px */}
                                        {allMonths.map((m, idx) => {
                                            const key = `${m.month}_${kpi.id}`;
                                            const editData = editValues[key] || { value: "", target: "" };
                                            const canEdit = idx === 0 || !isLocked;

                                            return (
                                                <td key={m.month}
                                                    className={`p-0 border-r border-slate-200 align-top transition-colors w-[200px] min-w-[200px] ${idx === 0
                                                        ? "sticky left-[220px] z-30 bg-[#F0FDF4] group-hover:bg-[#E9FBF0] border-r-2 border-slate-200 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)]"
                                                        : "bg-white group-hover:bg-slate-50"
                                                        }`}>
                                                    <div className="flex flex-col w-full h-full min-h-[90px]">
                                                        {/* 実績部 (45px) */}
                                                        <div className={`h-[45px] flex items-center justify-between px-4 border-b ${idx === 0 ? "border-white" : "border-slate-100"}`}>
                                                            <span className={`text-[9px] font-black shrink-0 ${idx === 0 ? "text-teal-700" : "text-slate-400"}`}>実績</span>
                                                            {!canEdit ? (
                                                                <span className={`text-[14px] font-black text-right w-full ${idx === 0 ? "text-teal-900" : "text-slate-700"}`}>
                                                                    {editData.value ? editData.value : "-"}
                                                                </span>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={editData.value}
                                                                    onChange={(e) => handleInputChange(m.month, kpi.id, 'value', e.target.value)}
                                                                    placeholder="---"
                                                                    className={`w-full text-right text-[14px] font-black outline-none bg-transparent placeholder-slate-200 ${idx === 0 ? "text-teal-900" : "text-slate-700"}`}
                                                                />
                                                            )}
                                                        </div>
                                                        {/* 目標部 (45px) */}
                                                        <div className="h-[45px] flex items-center justify-between px-4">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">目標</span>
                                                            {!canEdit ? (
                                                                <span className="text-[11px] font-bold text-slate-400 text-right w-full">
                                                                    {editData.target ? editData.target : "-"}
                                                                </span>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={editData.target}
                                                                    onChange={(e) => handleInputChange(m.month, kpi.id, 'target', e.target.value)}
                                                                    placeholder="---"
                                                                    className="w-full text-right text-[11px] font-bold outline-none bg-transparent placeholder-slate-200 text-slate-400"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-200 w-full min-w-[100px]"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-10 flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-slate-600">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium">
                        KPIの基礎項目定義は <Link href="/settings" className="text-teal hover:underline font-bold">組織情報設定</Link> から行ってください。
                    </p>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.4); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
            `}} />
        </div>
    );
}
