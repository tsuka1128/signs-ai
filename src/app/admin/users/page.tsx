"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import {
    Users,
    ShieldCheck,
    Mail,
    Calendar,
    MoreVertical,
    Search,
    UserPlus
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchAdmins() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("role", "super_admin")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setAdmins(data || []);
            } catch (error) {
                console.error("Error fetching admins:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAdmins();
    }, [supabase, authLoading]);

    const filteredAdmins = admins.filter(admin =>
        admin.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <Loading fullScreen message="管理者データを読み込んでいます..." />;
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            {/* Header Section */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-teal/10 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-teal" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">管理者アカウント</h1>
                    </div>
                    <p className="text-slate-500 font-medium">システム全体の特権管理者を管理します</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-[0.98]">
                    <UserPlus className="w-5 h-5" />
                    管理者を招待
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-teal" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Admins</p>
                        <p className="text-2xl font-black text-slate-900">{admins.length}<span className="text-sm ml-1 font-bold text-slate-400">名</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</p>
                        <p className="text-2xl font-black text-slate-900">Super Admin</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="管理者名やメールアドレスで検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">管理者</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">メールアドレス</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">権限</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">登録日</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                                        管理者がみつかりませんでした
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                                    {admin.display_name?.substring(0, 1) || "A"}
                                                </div>
                                                <div className="font-bold text-slate-800">{admin.display_name || "未設定"}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <Mail className="w-4 h-4 text-slate-300" />
                                                {admin.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                Super Admin
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs tabular-nums">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(admin.created_at).toLocaleDateString('ja-JP')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-300 hover:text-slate-600 transition-all shadow-sm">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
