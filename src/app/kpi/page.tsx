"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Info, Save, ArrowLeft, Building2 } from "lucide-react";
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
    const [pastMonths, setPastMonths] = useState<{ month: string, label: string }[]>([]);
    const [records, setRecords] = useState<Record<string, KpiRecord>>({}); // key: month_kpiId
    const [actuals, setActuals] = useState<Record<string, string>>({}); // key: kpiId
    const [targets, setTargets] = useState<Record<string, string>>({}); // key: kpiId
    const [currentMonthStr, setCurrentMonthStr] = useState("");

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

        // 1. 直近7ヶ月分（今月 + 過去6ヶ月）の月リストを生成
        const months: { month: string, label: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const monthStr = `${yyyy}-${mm}`;
            months.push({
                month: monthStr,
                label: i === 0 ? "今月" : `${yyyy} / ${mm}`
            });
        }
        setPastMonths(months.slice(1)); // 過去分
        const currentMonth = months[0].month;
        setCurrentMonthStr(currentMonth);

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

            const recMap: Record<string, KpiRecord> = {};
            const currentActuals: Record<string, string> = {};
            const currentTargets: Record<string, string> = {};

            recs?.forEach(r => {
                recMap[`${r.recorded_month}_${r.kpi_definition_id}`] = r;
                if (r.recorded_month === currentMonth) {
                    currentActuals[r.kpi_definition_id] = String(r.value);
                    currentTargets[r.kpi_definition_id] = r.target_value ? String(r.target_value) : "";
                }
            });

            setRecords(recMap);
            setActuals(currentActuals);
            setTargets(currentTargets);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user || kpiDefinitions.length === 0) return;
        setIsSaving(true);

        const upsertData = kpiDefinitions.map(kpi => ({
            kpi_definition_id: kpi.id,
            recorded_month: currentMonthStr,
            value: Number(actuals[kpi.id] || 0),
            target_value: targets[kpi.id] ? Number(targets[kpi.id]) : null
        }));

        const { error } = await supabase
            .from('kpi_records')
            .upsert(upsertData, { onConflict: 'kpi_definition_id, recorded_month' });

        if (error) {
            console.error("Save error:", error);
            alert("保存に失敗しました。");
        } else {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            fetchInitialData();
        }
        setIsSaving(false);
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

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${isSaved
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
                            <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] px-2 py-0">Main</Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse table-layout-fixed" style={{ minWidth: "1200px" }}>
                            <thead>
                                <tr>
                                    {/* 1. KPI Name (Sticky Left 0) - Width: 260px */}
                                    <th className="sticky left-0 top-0 z-40 w-[260px] min-w-[260px] bg-white border-b border-r border-slate-200 p-3 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">項目名 / 部署</span>
                                    </th>

                                    {/* 2. Current Month (Sticky Left 260px) - Width: 240px */}
                                    <th className="sticky left-[260px] top-0 z-40 w-[240px] min-w-[240px] bg-[#F0FDF4] border-b border-r-2 border-slate-300 p-2.5 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="text-[13px] font-black text-teal-800 tracking-tight flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                                                今月度
                                            </div>
                                            <span className="text-[9px] font-bold text-teal-600 bg-teal/10 px-1.5 py-0.5 rounded uppercase">Input</span>
                                        </div>
                                    </th>

                                    {/* 3. Past Months (Scrollable) - Width: 180px each */}
                                    {pastMonths.map(pm => (
                                        <th key={pm.month} className="w-[180px] min-w-[180px] bg-slate-50 border-b border-r border-slate-200 p-2.5 text-center">
                                            <div className="text-[11px] font-black text-slate-500">{pm.label}</div>
                                        </th>
                                    ))}
                                    <th className="bg-slate-50 border-b border-slate-200 w-full min-w-[100px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {kpiDefinitions.map((kpi, index) => (
                                    <tr key={kpi.id} className="group border-b border-slate-200 bg-white">
                                        {/* 1. KPI Name (Sticky Left 0) */}
                                        <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 p-0 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors align-top w-[260px]">
                                            <div className="flex flex-col h-full justify-between p-3 border-r border-slate-200">
                                                <div className="flex items-center gap-2 mb-2 ml-1">
                                                    <span className="text-[10px] font-black text-slate-300 w-3">{index + 1}.</span>
                                                    <span className="text-[13px] font-bold text-slate-800 leading-tight">{kpi.name}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:ml-5 gap-1.5">
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded shadow-sm w-fit truncate max-w-[120px]">
                                                        {kpi.owner_dept_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold bg-white px-1.5 rounded text-right whitespace-nowrap">
                                                        {kpi.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Current Month Input (Sticky Left 260px) */}
                                        <td className="sticky left-[260px] z-30 bg-[#F0FDF4] group-hover:bg-[#E9FBF0] border-r-2 border-slate-300 p-0 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)] transition-colors align-top w-[240px]">
                                            <div className="flex flex-col h-full w-full">
                                                <div className="flex flex-1 items-stretch border-b border-white">
                                                    <div className="w-11 flex items-center justify-center bg-white/70 border-r border-white/50 text-[10px] font-black text-teal-800 shrink-0">実績</div>
                                                    <input
                                                        type="number"
                                                        value={actuals[kpi.id] || ""}
                                                        onChange={(e) => setActuals({ ...actuals, [kpi.id]: e.target.value })}
                                                        placeholder="未入力"
                                                        className="w-full text-right px-4 py-3 text-sm font-black text-teal-900 bg-transparent outline-none focus:bg-white placeholder-teal-300/30"
                                                    />
                                                </div>
                                                <div className="flex flex-1 items-stretch">
                                                    <div className="w-11 flex items-center justify-center bg-white/40 border-r border-white/50 text-[9px] font-bold text-slate-500 shrink-0">目標</div>
                                                    <input
                                                        type="number"
                                                        value={targets[kpi.id] || ""}
                                                        onChange={(e) => setTargets({ ...targets, [kpi.id]: e.target.value })}
                                                        placeholder="未設定"
                                                        className="w-full text-right px-4 py-2 text-[11px] font-bold text-slate-500 bg-transparent outline-none focus:bg-white/80 placeholder-slate-300/30"
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. Past Months (Read-only) */}
                                        {pastMonths.map(pm => {
                                            const record = records[`${pm.month}_${kpi.id}`];
                                            return (
                                                <td key={pm.month} className="p-0 border-r border-slate-200 align-top bg-white group-hover:bg-slate-50 transition-colors w-[180px]">
                                                    <div className="flex flex-col h-full w-full">
                                                        <div className="flex flex-1 items-stretch border-b border-slate-100">
                                                            <div className="w-10 flex items-center justify-center bg-slate-50 border-r border-slate-100 text-[9px] font-bold text-slate-400 shrink-0">実績</div>
                                                            <div className="flex-1 text-right px-4 py-2 text-[12px] font-bold text-slate-700 bg-transparent flex items-center justify-end">
                                                                {record ? record.value.toLocaleString() : <span className="text-slate-200">-</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-1 items-stretch">
                                                            <div className="w-10 flex items-center justify-center bg-slate-50/50 border-r border-slate-100/50 text-[8px] font-medium text-slate-400 shrink-0">目標</div>
                                                            <div className="flex-1 text-right px-4 py-1.5 text-[11px] font-medium text-slate-400/80 bg-slate-50/20 flex items-center justify-end">
                                                                {record?.target_value ? record.target_value.toLocaleString() : <span className="text-slate-200">-</span>}
                                                            </div>
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
