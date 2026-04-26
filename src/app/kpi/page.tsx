"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Info, Save, ArrowLeft, Building2, Lock, Unlock, BarChart3, AlertTriangle, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/index";
import { Maximize2, Minimize2 } from "lucide-react";
import { HelpLink } from "@/components/ui/HelpLink";

// KPI定義の型
interface KpiDefinition {
    id: string;
    name: string;
    unit: string;
    owner_dept_id: string | null;
    owner_dept_name?: string;
    is_revenue?: boolean;
}

// KPI実績の型
interface KpiRecord {
    id?: string;
    company_id?: string;
    kpi_definition_id: string;
    axis_id: string | null;
    recorded_month: string;
    value: number;
    target_value: number | null;
}

// --- Components ---

interface KpiTableProps {
    title: string;
    axisId: string | null;
    isMain?: boolean;
    kpiDefinitions: KpiDefinition[];
    allMonths: { month: string, label: string }[];
    editValues: Record<string, { value: string, target: string }>;
    isLocked: boolean;
    onInputChange: (month: string, kpiId: string, axisId: string | null, field: 'value' | 'target', val: string) => void;
    onToggleLock: () => void;
    formatValue: (val: string, unit?: string) => string;
}

function KpiTable({ title, axisId, isMain, kpiDefinitions, allMonths, editValues, isLocked, onInputChange, onToggleLock, formatValue }: KpiTableProps) {
    const [focusedCell, setFocusedCell] = useState<string | null>(null); // month_kpiId_axisId_field

    return (
        <div className="bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden relative mx-auto w-full rounded-[16px] mb-12">
            <div className={`px-5 py-4 ${isMain ? "bg-slate-800" : "bg-slate-100"} ${isMain ? "text-white" : "text-slate-800"} border-b border-slate-200 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                    <Building2 className={`w-4 h-4 ${isMain ? "text-teal-400" : "text-slate-500"}`} />
                    <h2 className="text-sm font-black tracking-tight">{title}</h2>
                    {isMain && <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] px-2 py-0 uppercase tracking-tighter">Main</Badge>}
                </div>

                <button
                    onClick={onToggleLock}
                    className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest hover:opacity-70 px-3 py-1.5 rounded-lg transition-colors group"
                >
                    {isLocked ? (
                        <>
                            <Lock className={`w-3.5 h-3.5 ${isMain ? "text-slate-400" : "text-slate-400"} transition-colors`} />
                            <span className={isMain ? "text-slate-400" : "text-slate-400"}>今月度のみ入力可能</span>
                        </>
                    ) : (
                        <>
                            <Unlock className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                            <span className="text-teal-600">過去実績の編集モード有効</span>
                        </>
                    )}
                </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse table-layout-fixed" style={{ minWidth: "2500px" }}>
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-40 w-[220px] min-w-[220px] bg-white border-b border-r border-slate-200 p-3 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">項目名 / 部署</span>
                            </th>

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

                                {allMonths.map((m, idx) => {
                                    const key = `${m.month}_${kpi.id}_${axisId || 'main'}`;
                                    const editData = editValues[key] || { value: "", target: "" };
                                    const canEdit = idx === 0 || !isLocked;

                                    return (
                                        <td key={m.month}
                                            className={`p-0 border-r border-slate-200 align-top transition-colors w-[200px] min-w-[200px] ${idx === 0
                                                ? "sticky left-[220px] z-30 bg-[#F0FDF4] group-hover:bg-[#E9FBF0] border-r-2 border-slate-200 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)]"
                                                : "bg-white group-hover:bg-slate-50"
                                                }`}>
                                            <div className="flex flex-col w-full h-full min-h-[90px]">
                                                <div className={`h-[45px] flex items-center justify-between px-4 border-b ${idx === 0 ? "border-white" : "border-slate-100"}`}>
                                                    <span className={`text-[9px] font-black shrink-0 ${idx === 0 ? "text-teal-700" : "text-slate-400"}`}>実績</span>
                                                    {(!canEdit && focusedCell !== `${m.month}_${kpi.id}_${axisId || 'main'}_value`) ? (
                                                        <span className={`text-[14px] font-black text-right w-full ${idx === 0 ? "text-teal-900" : "text-slate-700"}`}>
                                                            {editData.value ? formatValue(editData.value, kpi.unit) : "-"}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type={focusedCell === `${m.month}_${kpi.id}_${axisId || 'main'}_value` ? "number" : "text"}
                                                            min="0"
                                                            value={focusedCell === `${m.month}_${kpi.id}_${axisId || 'main'}_value` ? editData.value : (editData.value ? formatValue(editData.value, kpi.unit) : "")}
                                                            onFocus={() => canEdit && setFocusedCell(`${m.month}_${kpi.id}_${axisId || 'main'}_value`)}
                                                            onBlur={() => setFocusedCell(null)}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/,/g, '');
                                                                if (!isNaN(Number(val)) || val === "") {
                                                                    onInputChange(m.month, kpi.id, axisId, 'value', val);
                                                                }
                                                            }}
                                                            readOnly={!canEdit}
                                                            placeholder="---"
                                                            className={`w-full text-right text-[14px] font-black outline-none bg-transparent placeholder-slate-200 transition-all ${idx === 0 ? "text-teal-900" : "text-slate-700"} ${!canEdit ? "cursor-default" : "focus:bg-white/50 rounded px-1"}`}
                                                        />
                                                    )}
                                                </div>
                                                <div className="h-[45px] flex items-center justify-between px-4">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">目標</span>
                                                    {(!canEdit && focusedCell !== `${m.month}_${kpi.id}_${axisId || 'main'}_target`) ? (
                                                        <span className="text-[14px] font-black text-slate-400 text-right w-full">
                                                            {editData.target ? formatValue(editData.target, kpi.unit) : "-"}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type={focusedCell === `${m.month}_${kpi.id}_${axisId || 'main'}_target` ? "number" : "text"}
                                                            min="0"
                                                            value={focusedCell === `${m.month}_${kpi.id}_${axisId || 'main'}_target` ? editData.target : (editData.target ? formatValue(editData.target, kpi.unit) : "")}
                                                            onFocus={() => canEdit && setFocusedCell(`${m.month}_${kpi.id}_${axisId || 'main'}_target`)}
                                                            onBlur={() => setFocusedCell(null)}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/,/g, '');
                                                                if (!isNaN(Number(val)) || val === "") {
                                                                    onInputChange(m.month, kpi.id, axisId, 'target', val);
                                                                }
                                                            }}
                                                            readOnly={!canEdit}
                                                            placeholder="---"
                                                            className={`w-full text-right text-[14px] font-black outline-none bg-transparent placeholder-slate-200 transition-all text-slate-400 ${!canEdit ? "cursor-default" : "focus:bg-white/50 rounded px-1"}`}
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
    );
}

export default function KpiInputPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [kpiDefinitions, setKpiDefinitions] = useState<KpiDefinition[]>([]);
    const [allMonths, setAllMonths] = useState<{ month: string, label: string }[]>([]);
    const [editValues, setEditValues] = useState<Record<string, { value: string, target: string }>>({}); // key: month_kpiId_axisId
    const [isLocked, setIsLocked] = useState(false);
    const [secondaryAxisName, setSecondaryAxisName] = useState("第2軸");
    const [axes, setAxes] = useState<any[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // カンマ区切りフォーマット関数
    const formatValue = (val: string, unit?: string) => {
        if (!val || val === "") return "";
        const num = Number(val);
        if (isNaN(num)) return val;
        
        // カンマを入れない単位の判定
        const noCommaUnits = ["年", "ID", "%"];
        if (unit && noCommaUnits.includes(unit)) {
            return val;
        }
        
        return num.toLocaleString();
    };

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

        const months: { month: string, label: string }[] = [];
        const now = new Date();
        // 常にその月の1日を基準にする
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const monthStr = `${yyyy}-${mm}-01`; // 'YYYY-MM-01' 形式に変更
            months.push({
                month: monthStr,
                label: i === 0 ? "今月度" : `${yyyy} / ${mm}`
            });
        }
        setAllMonths(months);

        const { data: userData } = await supabase.from('users').select('company_id, role, department_id').eq('id', authUser.id).single();
        
        // 管理者以外で会社に所属していない場合はオンボーディングへ
        if (!userData?.company_id && userData?.role !== 'super_admin') {
            router.push("/onboarding");
            return;
        }

        // 代理ログイン ID の調整 (super_admin ロールを最優先)
        let effectiveId = userData?.company_id;
        const isSuperAdmin = userData?.role === 'super_admin';

        if (isSuperAdmin && typeof window !== "undefined") {
            const impersonatedId = localStorage.getItem("impersonated_company_id");
            if (impersonatedId) {
                effectiveId = impersonatedId;
            }
        }

        // それでも ID が特定できない場合はオンボーディングへ（管理者の場合は管理画面を奨励、または何もしない）
        if (!effectiveId) {
            if (!isSuperAdmin) router.push("/onboarding");
            setLoading(false);
            return;
        }

        // 企業設定（第2軸名称）取得
        const { data: companyData } = await supabase.from('companies').select('kpi_secondary_axis_name').eq('id', effectiveId).single();
        if (companyData) setSecondaryAxisName(companyData.kpi_secondary_axis_name || "第2軸");

        // 第2軸項目取得
        const { data: axisData } = await supabase.from('kpi_axes').select('*').eq('company_id', effectiveId).order('sort_order', { ascending: true });
        setAxes(axisData || []);

        // KPI定義取得
        const { data: kpis } = await supabase.from('kpi_definitions').select('id, name, unit, owner_dept_id, departments(name)').eq('company_id', effectiveId).order('sort_order', { ascending: true });
        let formattedKpis = (kpis || []).map((k: any) => ({
            id: k.id,
            name: k.name,
            unit: k.unit,
            owner_dept_id: k.owner_dept_id,
            owner_dept_name: k.departments?.name || "未設定"
        }));

        if (userData?.role === 'manager' && userData.department_id) {
            formattedKpis = formattedKpis.filter(k => k.owner_dept_id === userData.department_id);
        }

        setKpiDefinitions(formattedKpis);

        // 実績値取得
        const monthList = months.map(m => m.month);
        const { data: recs, error: rErr } = await supabase.from('kpi_records').select('*').in('recorded_month', monthList);
        if (rErr) console.error("Records fetch error:", rErr);

        const initialEditValues: Record<string, { value: string, target: string }> = {};

        // 全ての組み合わせを初期化 (基本軸)
        formattedKpis.forEach(kpi => {
            monthList.forEach(month => {
                initialEditValues[`${month}_${kpi.id}_main`] = { value: "", target: "" };
                // 第2軸分も初期化
                (axisData || []).forEach(axis => {
                    initialEditValues[`${month}_${kpi.id}_${axis.id}`] = { value: "", target: "" };
                });
            });
        });

        // 既存データで上書き
        recs?.forEach(r => {
            const axisKey = r.axis_id || 'main';
            initialEditValues[`${r.recorded_month}_${r.kpi_definition_id}_${axisKey}`] = {
                value: String(r.value),
                target: r.target_value !== null ? String(r.target_value) : ""
            };
        });
        setEditValues(initialEditValues);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user || kpiDefinitions.length === 0) return;
        setIsSaving(true);

        const upsertData: any[] = [];
        Object.entries(editValues).forEach(([key, data]) => {
            const parts = key.split('_');
            const month = parts[0];
            const kpiId = parts[1];
            const axisId = parts[2] === 'main' ? null : parts[2];
            
            // KPI定義から所属部署IDを特定
            const kpiDef = kpiDefinitions.find(k => k.id === kpiId);
            const deptId = kpiDef?.owner_dept_id || null;

            if (data.value !== "" || data.target !== "") {
                upsertData.push({
                    kpi_definition_id: kpiId,
                    recorded_month: month,
                    axis_id: axisId,
                    department_id: deptId,
                    value: Number(data.value || 0),
                    target_value: data.target !== "" ? Number(data.target) : null
                });
            }
        });

        if (upsertData.length === 0) {
            setIsSaving(false);
            return;
        }

        const { error } = await supabase.from('kpi_records').upsert(upsertData, {
            onConflict: 'kpi_definition_id,recorded_month,department_id,axis_id'
        });

        if (error) {
            console.error("Save error details:", error);

            let userMessage = "保存に失敗しました。時間をおいて再度お試しください。";
            if (error.code === "23505") {
                userMessage = "データが重複しています。ページを再読み込みしてから再度お試しください。";
            } else if (error.code === "42501") {
                userMessage = "保存する権限がありません。管理者にお問い合わせください。";
            }

            setSaveError(userMessage);
            setTimeout(() => setSaveError(null), 8000);
            setIsSaved(false);
        } else {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            await fetchInitialData();
        }
        setIsSaving(false);
    };

    const handleInputChange = (month: string, kpiId: string, axisId: string | null, field: 'value' | 'target', val: string) => {
        const axisKey = axisId || 'main';
        setEditValues(prev => ({
            ...prev,
            [`${month}_${kpiId}_${axisKey}`]: {
                ...prev[`${month}_${kpiId}_${axisKey}`],
                [field]: val
            }
        }));
    };

    if (loading) {
        return <Loading fullScreen message="KPIデータを読み込んでいます..." />;
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
        <AppLayout hideSidebar={isFullScreen} fullWidth={isFullScreen}>
            <main className={cn("mx-auto transition-all duration-300", isFullScreen ? "max-w-full" : "max-w-[1400px]")}>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 w-full">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2 flex items-center gap-3">
                            月次KPI一括入力
                            <div className="flex items-center gap-2">
                                <Badge className="bg-teal/10 text-teal border-none text-[10px] font-bold px-2">管理者向け</Badge>
                                <a
                                    href="/docs/kpi-input"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal transition-colors"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    ヘルプ
                                </a>
                            </div>
                        </h1>
                        <p className="text-slate-500 text-base mt-2 max-w-2xl font-medium">全社のKPIの実績と目標を入力します。直近1年分の推移を確認しながら、入力・編集が可能です。</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 mt-4 sm:mt-0">
                        <button 
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                            title={isFullScreen ? "通常表示に戻す" : "全画面で表示"}
                        >
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            {isFullScreen ? "縮小" : "拡大表示"}
                        </button>
                        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
                            </svg>
                            Sheets連携設定
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm ${
                                isSaved
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : isSaving
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-teal hover:bg-teal/90 text-white hover:shadow-md hover:scale-[1.02]"
                            }`}
                        >
                            {isSaved ? (
                                <>保存しました ✓</>
                            ) : isSaving ? (
                                <>保存中...</>
                            ) : (
                                <>
                                    この内容で保存する
                                    <Save className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* 簡易トースト表示（エラー時） */}
                {saveError && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl shadow-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-bold">{saveError}</p>
                        </div>
                    </div>
                )}

                {/* 基本軸テーブル */}
                {kpiDefinitions.length > 0 ? (
                    <>
                        <KpiTable
                            title="全社・部署（基本）"
                            axisId={null}
                            isMain={true}
                            kpiDefinitions={kpiDefinitions}
                            allMonths={allMonths}
                            editValues={editValues}
                            isLocked={isLocked}
                            onInputChange={handleInputChange}
                            onToggleLock={() => setIsLocked(!isLocked)}
                            formatValue={formatValue}
                        />

                        {/* 第2軸（ブランド・エリア等）テーブル一覧 */}
                        {axes.length > 0 && (
                            <div className="mt-16 mb-8 pt-8 border-t border-slate-200">
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        {secondaryAxisName}別入力
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">{axes.length} items</span>
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">企業設定で定義された「{secondaryAxisName}」ごとの数値を入力します。</p>
                                </div>
                                {axes.map(axis => (
                                    <KpiTable
                                        key={axis.id}
                                        title={axis.name}
                                        axisId={axis.id}
                                        kpiDefinitions={kpiDefinitions}
                                        allMonths={allMonths}
                                        editValues={editValues}
                                        isLocked={isLocked}
                                        onInputChange={handleInputChange}
                                        onToggleLock={() => setIsLocked(!isLocked)}
                                        formatValue={formatValue}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        title="KPI項目が定義されていません"
                        description="まずは組織設定から、追跡したい重要指標(KPI)の名称や単位を定義してください。"
                        actionLabel="KPIを定義する"
                        actionHref="/settings"
                        icon={<BarChart3 className="w-12 h-12 text-slate-200" />}
                    />
                )}

                <div className="mt-10 flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-slate-600">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium">
                        KPIの基礎項目定義や、{secondaryAxisName}の項目管理は設定管理から行ってください。
                    </p>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.4); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
            `}} />
        </AppLayout>
    );
}
