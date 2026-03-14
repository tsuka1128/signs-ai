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
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// プラン別の推定単価
const PLAN_PRICES: Record<string, number> = {
    'Free': 0,
    'Team': 50000,
    'Standard': 150000,
    'Pro': 500000
};

export default function AdminBillingPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [companies, setCompanies] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (authLoading) return;
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
                    .order('created_at', { ascending: false });

                if (compErr) throw compErr;
                setCompanies(compData || []);
            } catch (error) {
                console.error("Error fetching billing data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [supabase, authLoading]);

    // プラン別の社数集計
    const planCounts = companies.reduce((acc, comp) => {
        const planName = comp.plans?.name || 'Unknown';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // 推定 MRR の計算
    const estimatedMRR = companies.reduce((total, comp) => {
        const planName = comp.plans?.name || 'Free';
        return total + (PLAN_PRICES[planName] || 0);
    }, 0);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || authLoading) {
        return <Loading fullScreen message="請求情報を集計しています..." />;
    }

    return (
        <main className="p-8 space-y-10 animate-fadeIn">
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
                </div>
            </header>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-teal/5 flex items-center justify-center text-teal mb-4">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 tabular-nums">¥{(estimatedMRR / 10000).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">万円</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 text-teal">推定 MRR (月次収益)</p>
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

            {/* Companies Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">プラン別利用状況一覧</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Contract Status</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">企業名</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">プラン</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ステータス</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">推定単価</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">契約開始日</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 italic">
                                                {company.name.substring(0, 1)}
                                            </div>
                                            <span className="font-bold text-slate-800">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={cn(
                                            "border-none font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase",
                                            company.plans?.name === 'Pro' ? "bg-amber-50 text-amber-600" :
                                                company.plans?.name === 'Standard' ? "bg-purple-50 text-purple-600" :
                                                    company.plans?.name === 'Team' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {company.plans?.name}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                company.status === 'active' ? "bg-emerald-500" :
                                                    company.status === 'trial' ? "bg-amber-400" : "bg-slate-300"
                                            )} />
                                            <span className="font-bold text-slate-600 capitalize">{company.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-slate-600 tabular-nums text-xs">
                                        ¥{(PLAN_PRICES[company.plans?.name || 'Free'] || 0).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 font-bold text-slate-500 tabular-nums text-xs">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                            {new Date(company.created_at).toLocaleDateString('ja-JP')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
