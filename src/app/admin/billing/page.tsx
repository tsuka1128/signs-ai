"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import {
    CreditCard,
    TrendingUp,
    Users,
    Building2,
    Calendar,
    ArrowUpRight,
    Search,
    BarChart3,
    Edit2,
    Mail,
    User,
    FileText,
    X,
    Save,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';

// プラン別の推定単価
const PLAN_PRICES: Record<string, number> = {
    'Free': 0,
    'Team': 50000,
    'Standard': 150000,
    'Pro': 500000
};

const PLAN_COLORS: Record<string, string> = {
    'Free': '#94a3b8',
    'Team': '#3b82f6',
    'Standard': '#a855f7',
    'Pro': '#f59e0b'
};

export default function AdminBillingPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [companies, setCompanies] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [chartData, setChartData] = useState<any[]>([]);
    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (authLoading) return;
            setLoading(true);
            try {
                // 1. プラン一覧の取得
                const { data: planData } = await supabase
                    .from('plans')
                    .select('*');
                setPlans(planData || []);

                // 2. 企業一覧とプラン情報の取得
                const { data: compData, error: compErr } = await supabase
                    .from('companies')
                    .select('*, plans(name)')
                    .order('created_at', { ascending: true }); // 時系列集計のために昇順で取得

                if (compErr) throw compErr;
                const fetchedCompanies = compData || [];
                setCompanies([...fetchedCompanies].reverse()); // テーブル表示用には降順に戻す

                // 3. グラフデータの生成 (過去6ヶ月)
                const months = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    months.push({
                        date: d,
                        label: `${d.getMonth() + 1}月`,
                        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                        mrr: 0,
                        Free: 0,
                        Team: 0,
                        Standard: 0,
                        Pro: 0
                    });
                }

                const timeSeries = months.map(month => {
                    let monthlyMRR = 0;
                    const counts: Record<string, number> = { Free: 0, Team: 0, Standard: 0, Pro: 0 };

                    fetchedCompanies.forEach(comp => {
                        const compDate = new Date(comp.created_at);
                        const compYearMonth = `${compDate.getFullYear()}-${String(compDate.getMonth() + 1).padStart(2, '0')}`;

                        if (compYearMonth <= month.yearMonth) {
                            // custom_mrr があればそれを優先、なければプラン単価
                            const planName = comp.plans?.name || 'Free';
                            const mrrValue = comp.custom_mrr !== null ? Number(comp.custom_mrr) : (PLAN_PRICES[planName] || 0);
                            monthlyMRR += mrrValue;
                            if (counts.hasOwnProperty(planName)) {
                                counts[planName]++;
                            }
                        }
                    });

                    return { ...month, mrr: monthlyMRR, ...counts };
                });

                setChartData(timeSeries);
            } catch (error) {
                console.error("Error fetching billing data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [supabase, authLoading]);

    const handleUpdateBilling = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCompany) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    plan_id: editingCompany.plan_id,
                    custom_mrr: editingCompany.custom_mrr || null,
                    setup_fee: editingCompany.setup_fee || null,
                    billing_email: editingCompany.billing_email,
                    billing_contact_name: editingCompany.billing_contact_name,
                    billing_memo: editingCompany.billing_memo,
                    contract_start_date: editingCompany.contract_start_date || null,
                    contract_end_date: editingCompany.contract_end_date || null,
                    cancellation_notice_date: editingCompany.cancellation_notice_date || null,
                    status: editingCompany.status
                })
                .eq('id', editingCompany.id);

            if (error) throw error;

            // データの再取得とステート更新
            const { data: compData } = await supabase
                .from('companies')
                .select('*, plans(name)')
                .order('created_at', { ascending: true });

            if (compData) {
                const fetchedCompanies = compData || [];
                setCompanies([...fetchedCompanies].reverse());

                // グラフデータの再計算 (useEffectと同じロジック)
                const months = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    months.push({
                        date: d,
                        label: `${d.getMonth() + 1}月`,
                        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                        mrr: 0,
                        Free: 0,
                        Team: 0,
                        Standard: 0,
                        Pro: 0
                    });
                }

                const timeSeries = months.map(month => {
                    let monthlyMRR = 0;
                    const counts: Record<string, number> = { Free: 0, Team: 0, Standard: 0, Pro: 0 };
                    fetchedCompanies.forEach(comp => {
                        const compDate = new Date(comp.created_at);
                        const compYearMonth = `${compDate.getFullYear()}-${String(compDate.getMonth() + 1).padStart(2, '0')}`;
                        if (compYearMonth <= month.yearMonth) {
                            const planName = comp.plans?.name || 'Free';
                            const mrrValue = comp.custom_mrr !== null ? Number(comp.custom_mrr) : (PLAN_PRICES[planName] || 0);
                            monthlyMRR += mrrValue;
                            if (counts.hasOwnProperty(planName)) counts[planName]++;
                        }
                    });
                    return { ...month, mrr: monthlyMRR, ...counts };
                });
                setChartData(timeSeries);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCompany.name || !editingCompany.plan_id) {
            alert("企業名とプランを選択してください");
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .insert([{
                    name: editingCompany.name,
                    plan_id: editingCompany.plan_id,
                    status: editingCompany.status,
                    custom_mrr: editingCompany.custom_mrr || null,
                    setup_fee: editingCompany.setup_fee || null,
                    billing_email: editingCompany.billing_email,
                    billing_contact_name: editingCompany.billing_contact_name,
                    billing_memo: editingCompany.billing_memo,
                    contract_start_date: editingCompany.contract_start_date || null,
                    contract_end_date: editingCompany.contract_end_date || null,
                    cancellation_notice_date: editingCompany.cancellation_notice_date || null
                }])
                .select(`*, plans(name)`)
                .single();

            if (error) throw error;

            // ページ全体をリロードせずにリストを更新（簡易版。本来はデータの完全同期が望ましい）
            window.location.reload();
        } catch (error: any) {
            console.error("Error creating company:", error);
            alert(`登録に失敗しました。\nエラー内容: ${error.message || "不明なエラー"}`);
        } finally {
            setIsSaving(false);
        }
    };

    // プラン別の社数集計
    const planCounts = companies.reduce((acc, comp) => {
        const planName = comp.plans?.name || 'Unknown';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // 推定 MRR の計算 (custom_mrr を優先)
    const totalMRR = companies.reduce((total, comp) => {
        const planName = comp.plans?.name || 'Free';
        const mrrValue = comp.custom_mrr !== null ? Number(comp.custom_mrr) : (PLAN_PRICES[planName] || 0);
        return total + mrrValue;
    }, 0);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || authLoading) {
        return <Loading fullScreen message="請求情報を集計しています..." />;
    }

    return (
        <main className="p-8 space-y-10 animate-fadeIn text-slate-900">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">プラン・請求管理</h1>
                    <p className="text-slate-500 font-medium">全テナントの契約状況と収益予測を管理します。</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="企業名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingCompany({
                                name: "",
                                plan_id: plans[0]?.id || "",
                                status: "trial",
                                custom_mrr: null,
                                setup_fee: null,
                                billing_email: "",
                                billing_contact_name: "",
                                billing_memo: "",
                                contract_start_date: null,
                                contract_end_date: null,
                                cancellation_notice_date: null
                            });
                            setIsAddingNew(true);
                        }}
                        className="px-4 py-2 bg-teal text-white rounded-xl text-sm font-bold shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        新規企業登録
                    </button>
                </div>
            </header>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm outline outline-2 outline-teal/20">
                    <div className="w-10 h-10 rounded-2xl bg-teal/5 flex items-center justify-center text-teal mb-4">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 tabular-nums">¥{totalMRR.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">円</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 text-teal">合計 MRR (手入力優先)</p>
                </div>

                {['Team', 'Standard', 'Pro'].map((planName) => (
                    <div key={planName} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                planName === 'Team' ? "bg-blue-50 text-blue-500" :
                                    planName === 'Standard' ? "bg-purple-50 text-purple-500" : "bg-amber-50 text-amber-500"
                            )}>
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full capitalize">
                                ¥{(PLAN_PRICES[planName] || 0).toLocaleString()} / 月
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800 tabular-nums">{planCounts[planName] || 0}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">社</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{planName} プラン</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MRR Trend Chart */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-teal" />
                            MRR 推移
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly Recurring Revenue</p>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(value) => `¥${Number(value).toLocaleString()}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '推定MRR']}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#2DD4BF" strokeWidth={4} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Distribution Trend */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            プラン別社数推移
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Plan Distribution Trend</p>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(value) => `${value}社`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="Pro" stroke={PLAN_COLORS.Pro} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Standard" stroke={PLAN_COLORS.Standard} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Team" stroke={PLAN_COLORS.Team} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Free" stroke={PLAN_COLORS.Free} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">プラン別利用状況一覧</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Contract Status</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1300px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 z-20">企業名</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">プラン</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MRR / 初期費用</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">契約開始日</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">契約終了日</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">解約通知日</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">請求先</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                    <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 italic">
                                                {company.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{company.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider tabular-nums">ID: {company.short_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={cn(
                                            "border-none font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase text-white",
                                            company.plans?.name === 'Pro' ? "bg-amber-500" :
                                                company.plans?.name === 'Standard' ? "bg-purple-500" :
                                                    company.plans?.name === 'Team' ? "bg-blue-500" : "bg-slate-400"
                                        )}>
                                            {company.plans?.name}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-700 text-xs">
                                                MRR: ¥{(company.custom_mrr || PLAN_PRICES[company.plans?.name || 'Free']).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400">
                                                Setup: ¥{(company.setup_fee || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-600 tabular-nums">
                                        {company.contract_start_date ? new Date(company.contract_start_date).toLocaleDateString('ja-JP') : '---'}
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-600 tabular-nums">
                                        {company.contract_end_date ? new Date(company.contract_end_date).toLocaleDateString('ja-JP') : '---'}
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-400 tabular-nums">
                                        {company.cancellation_notice_date ? new Date(company.cancellation_notice_date).toLocaleDateString('ja-JP') : '---'}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{company.billing_email || '-'}</div>
                                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{company.billing_contact_name || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => setEditingCompany({ ...company })}
                                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-teal transition-all shadow-sm group"
                                        >
                                            <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
                        <header className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isAddingNew ? "新規企業の登録" : "請求情報の編集"}
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {isAddingNew ? "New Enterprise Registration" : editingCompany.name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingCompany(null);
                                    setIsAddingNew(false);
                                }}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>
                        <form onSubmit={isAddingNew ? handleCreateCompany : handleUpdateBilling} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {isAddingNew && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">企業名</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingCompany.name || ""}
                                        onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                        placeholder="株式会社SignsAI"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">プラン</label>
                                    <select
                                        value={editingCompany.plan_id}
                                        onChange={(e) => setEditingCompany({ ...editingCompany, plan_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ステータス</label>
                                    <select
                                        value={editingCompany.status}
                                        onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="trial">Trial</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">契約期間・条件</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 ml-1">開始日</p>
                                        <input
                                            type="date"
                                            value={editingCompany.contract_start_date || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, contract_start_date: e.target.value || null })}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 ml-1">終了日</p>
                                        <input
                                            type="date"
                                            value={editingCompany.contract_end_date || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, contract_end_date: e.target.value || null })}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 ml-1">解約通知日</p>
                                        <input
                                            type="date"
                                            value={editingCompany.cancellation_notice_date || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, cancellation_notice_date: e.target.value || null })}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">月次収益 (MRR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                        <input
                                            type="number"
                                            value={editingCompany.custom_mrr || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, custom_mrr: e.target.value === "" ? null : Number(e.target.value) })}
                                            placeholder={(PLAN_PRICES[editingCompany.plans?.name || 'Free']).toLocaleString()}
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">初期費用 (Setup)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                        <input
                                            type="number"
                                            value={editingCompany.setup_fee || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, setup_fee: e.target.value === "" ? null : Number(e.target.value) })}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">請求先メールアドレス</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            value={editingCompany.billing_email || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, billing_email: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">請求先担当者</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={editingCompany.billing_contact_name || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, billing_contact_name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">請求メモ / 特記事項</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                        <textarea
                                            value={editingCompany.billing_memo || ""}
                                            onChange={(e) => setEditingCompany({ ...editingCompany, billing_memo: e.target.value })}
                                            rows={3}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <footer className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingCompany(null)}
                                    className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 px-6 bg-teal text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? "保存中..." : "保存する"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
