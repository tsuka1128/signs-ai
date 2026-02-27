"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Info, Save, ArrowLeft, FileSpreadsheet, Plus, Tags, Building2 } from "lucide-react";

// KPI定義マスター（管理画面で設定されるデータ）
const initialKpiDefinitions = [
    { id: "kpi-1", name: "売上", unit: "万円", owner: "営業部" },
    { id: "kpi-2", name: "商談獲得数", unit: "件", owner: "マーケ部" },
    { id: "kpi-3", name: "有効リード", unit: "件", owner: "マーケ部" },
    { id: "kpi-4", name: "契約件数", unit: "件", owner: "営業部" },
    { id: "kpi-5", name: "成約率", unit: "%", owner: "営業部" },
    { id: "kpi-6", name: "コスト", unit: "万円", owner: "財務経理部" },
    { id: "kpi-7", name: "解約率", unit: "%", owner: "CS部" },
    { id: "kpi-8", name: "NPS", unit: "pt", owner: "開発部" },
    { id: "kpi-9", name: "採用応募数", unit: "名", owner: "人事部" },
    { id: "kpi-10", name: "退職人数", unit: "名", owner: "人事部" },
];

// 過去の月のデータ (モック)
const pastMonths = [
    { month: "2026 / 01" },
    { month: "2025 / 12" },
    { month: "2025 / 11" },
    { month: "2025 / 10" },
    { month: "2025 / 09" },
    { month: "2025 / 08" },
];

// 第2軸のデータ（プロダクトなど）
const secondaryAxes = [
    { id: "prod-a", name: "プロダクト A" },
    { id: "prod-b", name: "プロダクト B" },
    { id: "prod-c", name: "プロダクト C" },
];

// モックデータジェネレーター（過去月用）
const getMockData = (axisId: string, kpiId: string, month: string, isTarget: boolean) => {
    // 完全にランダムではなく、ある程度の規則性を持たせたモック値
    if (isTarget) {
        if (month === "2026 / 01" && kpiId === "kpi-1") return axisId === "common" ? "3000" : "1000";
        if (month === "2026 / 01" && kpiId === "kpi-3") return axisId === "common" ? "45" : "15";
        return "";
    } else {
        if (kpiId === "kpi-1") return axisId === "common" ? "2800" : "900";
        if (kpiId === "kpi-3") return axisId === "common" ? "42" : "14";
        if (kpiId === "kpi-4") return "18";
        if (kpiId === "kpi-5") return "2";
        if (kpiId === "kpi-6") return "10";
        if (kpiId === "kpi-8") return "2.2";
        if (kpiId === "kpi-9") return "10";
        return Math.floor(Math.random() * 300 + 10).toString();
    }
};

export default function KpiInputPage() {
    // AxisId_KpiId の形式でデータを保持する
    const [targets, setTargets] = useState<Record<string, string>>({
        "common_kpi-1": "3200", // 全社MRR
        "common_kpi-2": "450",
        "common_kpi-3": "50",
        "common_kpi-4": "20",
        "prod-a_kpi-1": "1200", // プロダクトAのMRR
        "prod-b_kpi-1": "1500", // プロダクトBのMRR
    });
    const [actuals, setActuals] = useState<Record<string, string>>({
        "common_kpi-1": "3150",
        "common_kpi-3": "52",
        "common_kpi-4": "19.5",
        "common_kpi-6": "8",
        "common_kpi-8": "2.5",
        "prod-a_kpi-1": "1180",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }, 800);
    };

    // 共通のテーブル再利用コンポーネント
    const KpiTable = ({ axisInfo, isMain = false }: { axisInfo: { id: string, name: string, type: 'primary' | 'secondary' }, isMain?: boolean }) => {
        return (
            <div className={`bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border ${isMain ? 'border-slate-800' : 'border-slate-200'} overflow-hidden relative mx-auto w-full`} style={{ borderRadius: "16px" }}>
                {/* テーブルヘッダー領域 (見出し) */}
                <div className={`px-5 py-4 ${isMain ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'} border-b ${isMain ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                        {isMain ? (
                            <Building2 className="w-4 h-4 text-teal-400" />
                        ) : (
                            <Tags className="w-4 h-4 text-slate-400" />
                        )}
                        <h2 className="text-sm font-black tracking-tight">{axisInfo.name}</h2>
                        <Badge className={`${isMain ? 'bg-teal-500/20 text-teal-300' : 'bg-white border-slate-200 text-slate-500'} border-none text-[9px] px-2 py-0`}>
                            {isMain ? 'Main' : 'Axis 2'}
                        </Badge>
                    </div>
                </div>

                {/* スクロール領域 */}
                <div className="overflow-x-auto overflow-y-visible overscroll-x-contain custom-scrollbar relative">
                    <table className="w-full text-left border-collapse" style={{ minWidth: "1000px" }}>
                        <thead>
                            <tr>
                                {/* 1. KPI Name (Fixed left, Fully Opaque Background to prevent overlapping) */}
                                <th className="sticky left-0 top-0 z-30 w-[110px] sm:w-[260px] min-w-[110px] sm:min-w-[260px] max-w-[110px] sm:max-w-[260px] bg-white border-b border-r border-slate-200 p-2 sm:p-3 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                                    <span className="text-[8.5px] sm:text-[10px] font-black text-slate-500 tracking-tighter sm:tracking-widest uppercase sm:ml-1">項目名 / 部署</span>
                                </th>

                                {/* 2. Current Month (Fixed next to KPI, Fully Opaque Background) */}
                                <th className="sticky left-[110px] sm:left-[260px] top-0 z-30 w-[110px] sm:w-[240px] min-w-[110px] sm:min-w-[240px] max-w-[110px] sm:max-w-[240px] bg-[#F0FDF4] border-b border-r-2 border-slate-300 p-1.5 sm:p-2.5 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-0.5 sm:px-1 gap-1">
                                        <div className="text-[10px] sm:text-[13px] font-black text-teal-800 tracking-tighter sm:tracking-tight flex items-center gap-1 sm:gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse hidden sm:block" />
                                            2月度
                                        </div>
                                        <span className="text-[7.5px] sm:text-[9px] font-bold text-teal-600 bg-teal/10 px-1 sm:px-1.5 py-0.5 rounded uppercase w-fit scale-90 sm:scale-100 origin-left">Input</span>
                                    </div>
                                </th>

                                {/* 3. Past Months (Scrollable) */}
                                {pastMonths.map(pm => (
                                    <th key={pm.month} className="w-[110px] sm:w-[180px] min-w-[110px] sm:min-w-[180px] max-w-[110px] sm:max-w-[180px] bg-slate-50 border-b border-r border-slate-200 p-2 sm:p-2.5 text-center">
                                        <div className="text-[10px] sm:text-[11px] font-black text-slate-500">{pm.month}</div>
                                    </th>
                                ))}

                                {/* 余白埋め用のカラム */}
                                <th className="bg-slate-50 border-b border-slate-200 w-full min-w-[100px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialKpiDefinitions.map((kpi, index) => {
                                const fieldKey = `${axisInfo.id}_${kpi.id}`;
                                return (
                                    <tr key={fieldKey} className="group border-b border-slate-200 bg-white">

                                        {/* 1. KPI Name (Sticky) */}
                                        <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 p-0 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors align-top h-full w-[110px] sm:w-[260px] min-w-[110px] sm:min-w-[260px] max-w-[110px] sm:max-w-[260px]">
                                            <div className="flex flex-col h-full justify-between p-1.5 sm:p-3 border-r border-slate-200">
                                                <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 ml-0.5 sm:ml-1">
                                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-300 w-2.5 sm:w-3">{index + 1}.</span>
                                                    <span className="text-[10px] sm:text-[13px] font-bold text-slate-800 leading-tight break-words">{kpi.name}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:ml-5 gap-1.5">
                                                    <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1 sm:px-2 py-0.5 rounded shadow-sm w-fit truncate max-w-[90px] sm:max-w-[120px]">
                                                        {isMain ? kpi.owner : (kpi.owner.length > 3 ? kpi.owner.substring(0, 3) + '..' : kpi.owner)}
                                                    </span>
                                                    <span className="text-[8.5px] sm:text-[10px] text-slate-400 font-bold bg-white px-1 sm:px-1.5 rounded text-right whitespace-nowrap">
                                                        {kpi.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Current Month Input (Sticky) */}
                                        <td className="sticky left-[110px] sm:left-[260px] z-20 bg-[#F0FDF4] group-hover:bg-[#E9FBF0] border-r-2 border-slate-300 p-0 shadow-[8px_0_16px_-6px_rgba(0,0,0,0.08)] transition-colors align-top w-[110px] sm:w-[240px] min-w-[110px] sm:min-w-[240px] max-w-[110px] sm:max-w-[240px]">
                                            <div className="flex flex-col h-full w-full">
                                                {/* 実績入力 */}
                                                <div className="flex flex-1 items-stretch border-b border-white">
                                                    <div className="w-7 sm:w-11 flex items-center justify-center bg-white/70 border-r border-white/50 text-[7.5px] sm:text-[10px] font-black text-teal-800 shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
                                                        実績
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={actuals[fieldKey] || ""}
                                                        onChange={(e) => setActuals({ ...actuals, [fieldKey]: e.target.value })}
                                                        placeholder="未入力"
                                                        className="w-full text-right px-1.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm font-black text-teal-900 bg-transparent outline-none focus:bg-white placeholder-teal-300/30 transition-all focus:ring-1 focus:ring-inset focus:ring-teal/30"
                                                    />
                                                </div>
                                                {/* 目標入力 */}
                                                <div className="flex flex-1 items-stretch">
                                                    <div className="w-7 sm:w-11 flex items-center justify-center bg-white/40 border-r border-white/50 text-[7.5px] sm:text-[9px] font-bold text-slate-500 shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
                                                        目標
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={targets[fieldKey] || ""}
                                                        onChange={(e) => setTargets({ ...targets, [fieldKey]: e.target.value })}
                                                        placeholder="未設定"
                                                        className="w-full text-right px-1.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[11px] font-bold text-slate-500 bg-transparent outline-none focus:bg-white/80 placeholder-slate-300/30 transition-all focus:ring-1 focus:ring-inset focus:ring-teal/20"
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. Past Months (Read-only) */}
                                        {pastMonths.map(pm => {
                                            const pActual = getMockData(axisInfo.id, kpi.id, pm.month, false);
                                            const pTarget = getMockData(axisInfo.id, kpi.id, pm.month, true);

                                            return (
                                                <td key={pm.month} className="p-0 border-r border-slate-200 align-top bg-white group-hover:bg-slate-50 transition-colors w-[110px] sm:w-[180px] min-w-[110px] sm:min-w-[180px] max-w-[110px] sm:max-w-[180px]">
                                                    <div className="flex flex-col h-full w-full">
                                                        <div className="flex flex-1 items-stretch border-b border-slate-100">
                                                            <div className="w-7 sm:w-10 flex items-center justify-center bg-slate-50 border-r border-slate-100 text-[8px] sm:text-[9px] font-bold text-slate-400 shrink-0">
                                                                実績
                                                            </div>
                                                            <div className="flex-1 text-right px-1.5 sm:px-4 py-2 text-[11px] sm:text-[12px] font-bold text-slate-700 bg-transparent flex items-center justify-end">
                                                                {pActual ? Number(pActual).toLocaleString() : <span className="text-slate-200">-</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-1 items-stretch">
                                                            <div className="w-7 sm:w-10 flex items-center justify-center bg-slate-50/50 border-r border-slate-100/50 text-[7.5px] sm:text-[8px] font-medium text-slate-400 shrink-0">
                                                                目標
                                                            </div>
                                                            <div className="flex-1 text-right px-1.5 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400/80 bg-slate-50/20 flex items-center justify-end">
                                                                {pTarget ? Number(pTarget).toLocaleString() : <span className="text-slate-200">-</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* 余白埋め用のカラム */}
                                        <td className="bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-200 w-full min-w-[100px]"></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">
            <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">
                {/* Header */}
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
                            全社のKPI（基本）と、第2軸（プロダクトごと等）のKPIを独立した表で管理できます。<br className="hidden sm:block" />
                            先頭列を固定したまま横スクロールで過去の実績を振り返ることができます。
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Sheets連携設定
                        </button>
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

                {/* メインの表 */}
                <div className="mb-12">
                    <KpiTable axisInfo={{ id: "common", name: "全社・部署（基本）", type: "primary" }} isMain={true} />
                </div>

                {/* 第2軸のヘッダータイトル */}
                <div className="flex items-center justify-between mb-4 px-2 border-b border-slate-200 pb-4">
                    <h2 className="text-lg font-black text-slate-700 tracking-tight flex items-center gap-2">
                        <Tags className="w-5 h-5 text-slate-400" />
                        第2軸（プロダクト・地域など）
                    </h2>
                    <button className="inline-flex items-center gap-1.5 text-[12px] font-bold text-teal-600 bg-white border border-teal-200 hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        第2軸を追加
                    </button>
                </div>

                {/* 第2軸の表（それぞれ独立したテーブルコンポーネントとしてレンダリング） */}
                <div className="space-y-8">
                    {secondaryAxes.map(axis => (
                        <KpiTable key={axis.id} axisInfo={{ ...axis, type: "secondary" }} />
                    ))}
                </div>

                {/* Note about Master Data */}
                <div className="mt-10 flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-slate-600">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium">
                        KPIの基礎項目定義は <Link href="#" className="text-teal hover:underline font-bold">KPI管理設定</Link> から行ってください。<br />
                        第2軸（プロダクト等）を追加した場合でも、基本となる10個のKPIテンプレートが自動的に適用されます。
                    </p>
                </div>

            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar {
                    padding-bottom: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(203, 213, 225, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(148, 163, 184, 0.8);
                }
            `}} />
        </div>
    );
}
