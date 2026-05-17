"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import {
    ArrowLeft,
    Building2,
    Users,
    Layers,
    BarChart3,
    Settings,
    ExternalLink,
    ShieldAlert,
    AlertCircle,
    Calendar,
    Mail,
    ChevronRight,
    Search,
    Zap,
    Upload,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/index";
import { CopyButton } from "@/components/ui/CopyButton";
import { HistoryModal } from "@/components/admin/HistoryModal";
import { AdminDepartmentsModal, AdminKpisModal, AdminCompanySettingsModal, AdminAxesModal, AdminPlanOverridesModal } from "@/components/admin/QuickEditModals";
import { AVAILABLE_ADDONS } from "@/lib/addons";
import { AnimatePresence } from "framer-motion";
import { CSVImportModal } from "@/components/admin/CSVImportModal";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { toast } from "sonner";

export default function AdminCompanyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const companyId = params.id as string;
    const { supabase, loading: authLoading, impersonate } = useAdmin();

    const [company, setCompany] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);
    const [stats, setStats] = useState({ users: 0, responses: 0 });
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showKpiModal, setShowKpiModal] = useState(false);
    const [showAxisModal, setShowAxisModal] = useState(false);
    const [showOverridesModal, setShowOverridesModal] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [importType, setImportType] = useState<'kpi' | 'resource' | null>(null);
    const [axes, setAxes] = useState<any[]>([]);

    const { generateKpiCsvTemplate, generateResourceCsvTemplate } = useAdminSettings(companyId);

    const handleRunAI = async () => {
        if (!companyId || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const resp = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetCompanyId: companyId })
            });
            const result = await resp.json();
            if (!resp.ok) throw new Error(result.error || 'AI分析に失敗しました');
            toast.success('AI分析が完了しました。');
            router.refresh();
        } catch (error: any) {
            console.error("AI Analysis Error:", error);
            toast.error(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportCsv = async (type: 'kpi' | 'resource') => {
        try {
            const csv = type === 'kpi' ? await generateKpiCsvTemplate() : await generateResourceCsvTemplate();
            if (!csv) return;

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${type}_records_template_${company?.name}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("CSV Export Error:", error);
            toast.error("CSVエクスポートに失敗しました。");
        }
    };

    const fetchCompanyDetails = async () => {
        if (authLoading || !companyId) return;
        try {
            // 1. 企業基本情報
            const { data: comp, error: compErr } = await supabase
                .from('companies')
                .select('*, plans(*)')
                .eq('id', companyId)
                .single();
            if (compErr) throw compErr;
            setCompany(comp);

            // 2. 部署一覧
            const { data: depts } = await supabase
                .from('departments')
                .select('*')
                .eq('company_id', companyId)
                .order('sort_order', { ascending: true }); // sort_order 順に修正
            setDepartments(depts || []);

            // 3. KPI定義一覧
            const { data: kpiData } = await supabase
                .from('kpi_definitions')
                .select('*')
                .eq('company_id', companyId)
                .order('sort_order', { ascending: true });
            setKpis(kpiData || []);

            // 4. 第2軸
            const { data: axisData } = await supabase
                .from('kpi_axes')
                .select('*')
                .eq('company_id', companyId)
                .order('sort_order', { ascending: true });
            setAxes(axisData || []);

            // 5. 統計 (ユーザー数、回答数)
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);

            const { count: respCount } = await supabase
                .from('survey_responses')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);

            setStats({ users: userCount || 0, responses: respCount || 0 });

        } catch (error) {
            console.error("Error fetching company details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyDetails();
    }, [supabase, authLoading, companyId]);

    if (loading || authLoading) {
        return <Loading fullScreen message="企業情報を読み込んでいます..." />;
    }

    if (!company) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-slate-500">企業が見つかりませんでした。</p>
                <Link href="/admin/companies" className="text-teal font-bold hover:underline">一覧に戻る</Link>
            </div>
        );
    }


    const trialEndTime = company ? new Date(company.created_at).getTime() + 70 * 24 * 60 * 60 * 1000 : 0;
    const isExpired = company?.status === 'trial' && Date.now() > trialEndTime;

    return (
        <main className="p-8 space-y-8 animate-fadeIn">
            <header className="flex flex-col gap-6">
                <Link
                    href="/admin/companies"
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    企業一覧に戻る
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl font-black text-slate-300 italic">
                            {company.name.substring(0, 1)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{company.name}</h1>

                                <Badge className={cn(
                                    "border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase",
                                    isExpired ? "bg-rose-50 text-rose-600" :
                                    company.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                                        company.status === 'trial' ? "bg-amber-50 text-amber-600" :
                                            "bg-slate-100 text-slate-500"
                                )}>
                                    {isExpired ? "Expired" : company.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> 
                                    {new Date(company.created_at).toLocaleDateString('ja-JP')} 契約開始
                                </span>
                                {company.status === 'trial' && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">

                                        <AlertCircle className={cn("w-3 h-3", isExpired && "animate-pulse")} />
                                        <span>トライアル終了予定: {
                                            new Date(trialEndTime).toLocaleDateString('ja-JP')
                                        } {isExpired && "(期限切れ)"}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 group/id">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Signs ID:</span>
                                    <span className="text-slate-600 font-bold tracking-widest">{company.short_id || "---"}</span>
                                    <CopyButton value={company.short_id || ""} iconSize={10} className="p-0.5 bg-white border-none shadow-none" />
                                </div>
                                <div className="flex items-center gap-2 group/uuid">
                                    <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="uppercase tracking-tighter opacity-60">UUID: {company.id}</span>
                                    <CopyButton value={company.id} iconSize={10} className="p-0.5 bg-transparent border-none shadow-none text-slate-300 hover:text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowHistory(true)}
                            className="px-6 py-3 bg-slate-100 border border-transparent rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2 group whitespace-nowrap"
                        >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            代理操作履歴
                        </button>
                        <button
                            onClick={handleRunAI}
                            disabled={isAnalyzing}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 group whitespace-nowrap",
                                isAnalyzing 
                                    ? "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                                    : "bg-white border border-teal/20 text-teal hover:bg-teal/5 hover:border-teal/30"
                            )}
                        >
                            {isAnalyzing ? "分析を生成中..." : "AI分析を実行"}
                            {!isAnalyzing && <Zap className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => impersonate(company.id)}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 group whitespace-nowrap"
                        >
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal transition-colors" />
                            代理ログイン
                        </button>
                        <button 
                            onClick={() => setShowCompanyModal(true)}
                            className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 whitespace-nowrap"
                        >
                            企業設定を編集
                        </button>
                    </div>
                </div>
            </header>

            {/* Impersonation History Modal */}
            {showHistory && (
                <HistoryModal 
                    companyId={company.id} 
                    companyName={company.name} 
                    onClose={() => setShowHistory(false)} 
                />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {[
                    { label: "契約プラン", value: company.plans?.name || "---", icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "登録ユーザー", value: stats.users, unit: "名", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                    { label: "分析部署数", value: departments.length, unit: "拠点", icon: Layers, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "累計回答数", value: stats.responses, unit: "件", icon: BarChart3, color: "text-teal", bg: "bg-teal/5" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-800 tabular-nums">{stat.value}</span>
                                {stat.unit && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.unit}</span>}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                ))}
                
                {/* Options List Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-teal/5 text-teal flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="space-y-2.5">
                            {AVAILABLE_ADDONS.map(addon => {
                                const isIncluded = addon.includedInPlans.includes(company.plan_id);
                                const isEnabled = isIncluded || company[addon.id];
                                if (!isEnabled) return null;

                                return (
                                    <div key={addon.id} className="flex items-center justify-between group/addon">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                                            <span className="text-[11px] font-black text-slate-700 tracking-tight">{addon.shortName}</span>
                                        </div>
                                        <Badge className={cn(
                                            "bg-transparent border-none font-black text-[8px] p-0 uppercase tracking-tighter",
                                            isIncluded ? "text-slate-300" : "text-teal/60"
                                        )}>
                                            {isIncluded ? "Incl." : "Active"}
                                        </Badge>
                                    </div>
                                );
                            })}
                            {!AVAILABLE_ADDONS.some(a => a.includedInPlans.includes(company.plan_id) || company[a.id]) && (
                                <p className="text-[11px] font-bold text-slate-300 italic">標準機能のみ</p>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 pt-4">オプション構成</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-400">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Current Plan</span>
                        </div>
                        <button 
                            onClick={() => setShowOverridesModal(true)}
                            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{company.plans?.name || 'Standard'}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">マスタープランの設定に準拠</p>
                    </div>
                </div>

                {[
                    { label: 'Max Depts', key: 'max_departments', val: company.plans?.max_departments },
                    { label: 'Max KPIs', key: 'max_kpis', val: company.plans?.max_kpis },
                    { label: 'Max Members', key: 'max_headcount', val: company.plans?.max_headcount }
                ].map(item => {
                    const override = (company as any).plan_overrides?.[item.key];
                    const isOverridden = override !== undefined && override !== null;
                    return (
                        <div key={item.key} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className={cn("text-2xl font-black", isOverridden ? "text-amber-500" : "text-slate-800")}>
                                    {isOverridden ? override : item.val}
                                </p>
                                {isOverridden && (
                                    <span className="text-[9px] font-black text-amber-400 uppercase">Custom</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={cn(
                "grid grid-cols-1 gap-8",
                axes.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"
            )}>
                {/* Departments List */}
                <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">部署・拠点構成</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Departments ({departments.length})</p>
                        </div>
                        <button 
                            onClick={() => setShowDeptModal(true)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
                        {departments.map((dept) => (
                            <div key={dept.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 font-bold italic">
                                        {dept.name.substring(0, 1)}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{dept.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400">
                                        <Users className="w-3 h-3" />
                                        {dept.headcount}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Second Axis List (Conditional) */}
                {axes.length > 0 && (
                    <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">{company.secondary_axis_name || "第2軸"}</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Secondary Axis Items ({axes.length})</p>
                            </div>
                            <button 
                                onClick={() => setShowAxisModal(true)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
                            {axes.map((axis) => (
                                <div key={axis.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 font-bold italic">
                                            {axis.name.substring(0, 1)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{axis.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400">
                                        <Users className="w-3 h-3" />
                                        {axis.headcount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* KPI Definitions */}
                <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">KPI定義</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">KPI Definitions ({kpis.length})</p>
                        </div>
                        <button 
                            onClick={() => setShowKpiModal(true)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
                        {kpis.map((kpi) => (
                            <div key={kpi.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-teal/5 flex items-center justify-center text-teal font-black text-[10px]">
                                        {kpi.unit || 'pt'}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{kpi.name}</span>
                                </div>
                                <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[10px] tracking-widest px-2 py-0.5 rounded-full uppercase">
                                    # {kpi.sort_order}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* CSV Integration Section */}
            <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <header className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-3 text-teal mb-1">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Integration</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">データ連携 (CSV)</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">実績データの一括エクスポート・インポートを行います。</p>
                </header>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* KPI Records */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                            KPI実績データ
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => handleExportCsv('kpi')}
                                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                記入用フォーマットを書き出す
                            </button>
                            <button 
                                onClick={() => setImportType('kpi')}
                                className="px-5 py-2.5 bg-teal text-white rounded-xl text-xs font-black hover:bg-teal/90 transition-all shadow-md flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                実績をインポート
                            </button>
                        </div>
                    </div>

                    {/* Resource Records */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            部署・人件費実績データ
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => handleExportCsv('resource')}
                                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                記入用フォーマットを書き出す
                            </button>
                            <button 
                                onClick={() => setImportType('resource')}
                                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition-all shadow-md flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                実績をインポート
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Admin Quick Edit Modals */}
            <AnimatePresence>
                {showDeptModal && (
                    <AdminDepartmentsModal 
                        companyId={company.id}
                        companyName={company.name}
                        onClose={() => setShowDeptModal(false)}
                        onSuccess={fetchCompanyDetails}
                    />
                )}
                {showKpiModal && (
                    <AdminKpisModal 
                        companyId={company.id}
                        companyName={company.name}
                        onClose={() => setShowKpiModal(false)}
                        onSuccess={fetchCompanyDetails}
                    />
                )}
                {showAxisModal && (
                    <AdminAxesModal 
                        companyId={company.id}
                        companyName={company.name}
                        onClose={() => setShowAxisModal(false)}
                        onSuccess={fetchCompanyDetails}
                    />
                )}
                {showOverridesModal && (
                    <AdminPlanOverridesModal 
                        companyId={company.id}
                        companyName={company.name}
                        onClose={() => setShowOverridesModal(false)}
                        onSuccess={fetchCompanyDetails}
                    />
                )}
                {showCompanyModal && (
                    <AdminCompanySettingsModal 
                        companyId={company.id}
                        companyName={company.name}
                        onClose={() => setShowCompanyModal(false)}
                        onSuccess={fetchCompanyDetails}
                    />
                )}
                {importType && (
                    <CSVImportModal
                        companyId={company.id}
                        type={importType}
                        onClose={() => setImportType(null)}
                        onSuccess={() => {
                            setImportType(null);
                            fetchCompanyDetails();
                        }}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
