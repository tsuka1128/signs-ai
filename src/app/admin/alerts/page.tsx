"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import {
    ShieldAlert,
    AlertTriangle,
    Info,
    Building2,
    ArrowRight,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminAlert {
    id: string;
    companyId: string;
    companyName: string;
    type: 'onboarding' | 'inactivity' | 'system';
    severity: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
}

export default function AdminAlertsPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [alerts, setAlerts] = useState<AdminAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAlerts() {
            if (authLoading) return;
            try {
                // 1. 企業とその部署・KPIの状況を取得
                const { data: companies, error } = await supabase
                    .from('companies')
                    .select(`
                        id, 
                        name, 
                        status,
                        created_at,
                        updated_at,
                        departments(count),
                        kpi_definitions(count)
                    `);

                if (error) throw error;

                const generatedAlerts: AdminAlert[] = [];
                const now = new Date();

                companies?.forEach(comp => {
                    const deptCount = comp.departments?.[0]?.count || 0;
                    const kpiCount = comp.kpi_definitions?.[0]?.count || 0;
                    const updatedAt = new Date(comp.updated_at);
                    const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

                    // オンボーディング未完了アラート
                    if (deptCount === 0 || kpiCount === 0) {
                        generatedAlerts.push({
                            id: `onboarding-${comp.id}`,
                            companyId: comp.id,
                            companyName: comp.name,
                            type: 'onboarding',
                            severity: 'high',
                            message: `${deptCount === 0 ? '部署' : ''}${deptCount === 0 && kpiCount === 0 ? '・' : ''}${kpiCount === 0 ? 'KPI定義' : ''}が未設定です。`,
                            timestamp: comp.created_at
                        });
                    }

                    // 非アクティブアラート
                    if (daysSinceUpdate >= 30) {
                        generatedAlerts.push({
                            id: `inactivity-${comp.id}`,
                            companyId: comp.id,
                            companyName: comp.name,
                            type: 'inactivity',
                            severity: daysSinceUpdate >= 60 ? 'high' : 'medium',
                            message: `最終更新から ${daysSinceUpdate} 日が経過しています。活用が停滞している可能性があります。`,
                            timestamp: comp.updated_at
                        });
                    }
                });

                // 重い順（severity: high -> medium -> low）にソート
                const severityWeight = { high: 3, medium: 2, low: 1 };
                generatedAlerts.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

                setAlerts(generatedAlerts);
            } catch (error) {
                console.error("Error generating alerts:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAlerts();
    }, [supabase, authLoading]);

    if (loading || authLoading) {
        return <Loading fullScreen message="アラートをスキャン中..." />;
    }

    return (
        <main className="p-8 space-y-10 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                        システムアラート
                    </h1>
                    <p className="text-slate-500 font-medium">注意が必要なテナントを自動検知して表示します。</p>
                </div>
            </header>

            {/* Alert Grid */}
            <div className="grid grid-cols-1 gap-4">
                {alerts.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                            <Info className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-emerald-800">現在アラートはありません</h3>
                        <p className="text-emerald-600 font-medium">全てのテナントが正常に稼働しています。</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className={cn(
                            "bg-white rounded-3xl p-6 border transition-all hover:shadow-md flex flex-col md:flex-row md:items-center gap-6",
                            alert.severity === 'high' ? "border-rose-100" : "border-amber-100"
                        )}>
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                alert.severity === 'high' ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                            )}>
                                {alert.severity === 'high' ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800">{alert.companyName}</span>
                                    <Badge className={cn(
                                        "border-none text-[10px] px-2 py-0",
                                        alert.type === 'onboarding' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                    )}>
                                        {alert.type === 'onboarding' ? 'オンボーディング' : '非アクティブ'}
                                    </Badge>
                                </div>
                                <p className="text-sm font-bold text-slate-500">{alert.message}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden lg:block">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">発生日 / 最終更新</p>
                                    <p className="text-xs font-bold text-slate-500">{new Date(alert.timestamp).toLocaleDateString('ja-JP')}</p>
                                </div>
                                <Link
                                    href={`/admin/companies/${alert.companyId}`}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                    詳細を確認
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
