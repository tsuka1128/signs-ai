"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { 
    Search, 
    Filter, 
    Calendar, 
    User as UserIcon, 
    Building2, 
    ChevronRight,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLogsPage() {
    const { isSuperAdmin, loading: authLoading } = useAdmin();
    const { logs, loading, fetchLogs } = useAdminLogs();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && isSuperAdmin) {
            fetchLogs();
        }
    }, [authLoading, isSuperAdmin, fetchLogs]);

    const filteredLogs = logs.filter(log => 
        log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.admin?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || (loading && logs.length === 0)) {
        return <Loading fullScreen message="操作ログを読み込んでいます..." />;
    }

    const getActionBadgeColor = (action: string) => {
        if (action.includes('delete')) return "bg-rose-50 text-rose-600";
        if (action.includes('update')) return "bg-blue-50 text-blue-600";
        if (action.includes('impersonate')) return "bg-amber-50 text-amber-600";
        return "bg-slate-50 text-slate-600";
    };

    return (
        <main className="p-8 space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">操作ログ</h1>
                    <p className="text-sm text-slate-500 font-medium">システム内で行われた管理操作の履歴を確認します。</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="名前、アクション、企業で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all w-80 shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">実行日時</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">実行者</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">対象企業</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">アクション</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-slate-500 tabular-nums">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                            {new Date(log.created_at).toLocaleString('ja-JP')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{log.admin?.display_name || '不明なユーザー'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{log.admin?.email || 'email hook error'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {log.company ? (
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <Building2 className="w-3.5 h-3.5 text-slate-300" />
                                                {log.company.name}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-bold italic">システム全体</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={cn(
                                            "border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase",
                                            getActionBadgeColor(log.action_type)
                                        )}>
                                            {log.action_type}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2 text-slate-400 hover:text-teal hover:bg-teal/5 rounded-xl transition-all"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="py-20 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">ログが見つかりませんでした</h3>
                        <p className="text-xs text-slate-400">条件を変えてお試しください。</p>
                    </div>
                )}
            </div>

            {/* 詳細モーダル */}
            {selectedLog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 tracking-tighter">操作詳細</h2>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">アクション詳細 (JSON)</h4>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 overflow-x-auto">
                                        <pre className="text-xs font-mono text-slate-600">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                </section>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP / User Agent</h4>
                                        <p className="text-xs font-bold text-slate-600 truncate">{selectedLog.details?.userAgent || '---'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Path</h4>
                                        <p className="text-xs font-bold text-slate-600">{selectedLog.details?.pathname || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
