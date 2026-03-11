"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import {
    Search,
    Filter,
    MoreHorizontal,
    ExternalLink,
    TrendingUp,
    Users as UsersIcon,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminCompaniesPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchCompanies() {
            if (authLoading) return;
            try {
                // 企業、プラン、ユーザー数、部署数を取得
                const { data, error } = await supabase
                    .from('companies')
                    .select(`
                        *,
                        plans(name),
                        users(count),
                        departments(count)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setCompanies(data || []);
            } catch (error) {
                console.error("Error fetching companies:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCompanies();
    }, [supabase, authLoading]);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || authLoading) {
        return <Loading fullScreen message="企業一覧を読み込んでいます..." />;
    }

    return (
        <main className="p-8 space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">契約企業管理</h1>
                    <p className="text-sm text-slate-500 font-medium">導入企業のステータス、プラン、利用状況を管理します。</p>
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
                    <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="px-4 py-2 bg-teal text-white rounded-xl text-sm font-bold shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all">
                        新規企業登録
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-teal/5 flex items-center justify-center text-teal">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">総企業数</p>
                        <p className="text-2xl font-black text-slate-800">{companies.length} <span className="text-xs font-bold text-slate-400 lowercase">companies</span></p>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">アクティブ企業</p>
                        <p className="text-2xl font-black text-slate-800">{companies.filter(c => c.status === 'active').length} <span className="text-xs font-bold text-slate-400 lowercase">active</span></p>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">トライアル中</p>
                        <p className="text-2xl font-black text-slate-800">{companies.filter(c => c.status === 'trial').length} <span className="text-xs font-bold text-slate-400 lowercase">on trial</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">企業名</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ステータス</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">プラン</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ユーザー</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">部署/KPI</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">契約開始日</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all italic">
                                                {company.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{company.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {company.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={cn(
                                            "border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase",
                                            company.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                                                company.status === 'trial' ? "bg-amber-50 text-amber-600" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {company.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-slate-600">
                                        {company.plans?.name || '---'}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                            <UsersIcon className="w-3.5 h-3.5 text-slate-300" />
                                            {company.users?.[0]?.count || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-bold text-slate-600">
                                            {company.departments?.[0]?.count || 0} <span className="text-slate-300 mx-1">/</span> {company.kpi_definitions_count || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-slate-500 tabular-nums">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                            {new Date(company.created_at).toLocaleDateString('ja-JP')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/companies/${company.id}`}
                                                className="p-2 text-slate-400 hover:text-teal hover:bg-teal/5 rounded-xl transition-all"
                                                title="詳細を見る"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCompanies.length === 0 && (
                    <div className="py-20 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">企業が見つかりませんでした</h3>
                        <p className="text-xs text-slate-400">検索条件を変えてお試しください。</p>
                    </div>
                )}
            </div>
        </main>
    );
}

// 必要なアイコン（重複インポート防止のため調整が必要な場合用）
import { Building2, AlertCircle } from "lucide-react";
