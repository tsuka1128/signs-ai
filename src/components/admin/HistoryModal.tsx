"use client";

import { useState, useEffect } from "react";
import { 
    X, 
    History, 
    User, 
    Clock, 
    Activity, 
    ExternalLink,
    ChevronRight,
    Search
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
interface HistoryModalProps {
    companyId?: string;
    companyName?: string;
    onClose: () => void;
}

export function HistoryModal({ companyId, companyName, onClose }: HistoryModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(dateString));
    };

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            try {
                let query = supabase
                    .from('admin_activity_logs')
                    .select(`
                        *,
                        admin:users!admin_activity_logs_admin_id_fkey(display_name, email)
                    `)
                    .order('created_at', { ascending: false });

                if (companyId) {
                    query = query.eq('target_company_id', companyId);
                }

                const { data, error } = await query.limit(50);
                if (error) throw error;
                setLogs(data || []);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, [supabase, companyId]);

    const getActionLabel = (type: string) => {
        switch (type) {
            case 'impersonate_start': return { label: '代理ログイン開始', color: 'text-amber-600 bg-amber-50' };
            case 'impersonate_stop': return { label: '代理ログイン終了', color: 'text-slate-500 bg-slate-50' };
            default: return { label: type, color: 'text-slate-400 bg-slate-50' };
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="bg-white w-full max-w-3xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[20px] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">操作履歴（監査ログ）</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                {companyName ? `${companyName} の履歴` : "システム全域の履歴"}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loading message="履歴を読み込んでいます..." />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <Activity className="w-12 h-12 text-slate-300" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">履歴データがありません</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => {
                                const action = getActionLabel(log.action_type);
                                return (
                                    <div key={log.id} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-md transition-all flex items-start gap-5">
                                        <div className="flex flex-col items-center gap-1.5 pt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-teal transition-colors" />
                                            <div className="w-[1px] h-full bg-slate-100 flex-1" />
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                            {/* Timer & Admin */}
                                            <div className="md:col-span-5 space-y-1.5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{log.admin?.display_name || "不明な管理者"}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{log.admin?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="md:col-span-4">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ring-1 ring-inset",
                                                    action.color,
                                                    log.action_type === 'impersonate_start' ? "ring-amber-200" : "ring-slate-100"
                                                )}>
                                                    {action.label}
                                                </div>
                                            </div>

                                            {/* Details Metadata */}
                                            <div className="md:col-span-3 text-right">
                                                {log.details?.userAgent && (
                                                    <div className="text-[10px] text-slate-300 font-bold uppercase truncate" title={log.details.userAgent}>
                                                        {log.details.userAgent.includes("Mac") ? "MacOS / Browser" : "Device / Other"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldAlert className="w-3 h-3" />
                        この操作履歴は削除できません（監査証跡）
                    </p>
                </footer>
            </div>
        </div>,
        document.body
    );
}

function ShieldAlert({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}
