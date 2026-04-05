"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import {
    Building2,
    Users,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanDetailsModal } from "@/components/admin/PlanDetailsModal";
import { AnimatePresence } from "framer-motion";

interface Stats {
    companyCount: number;
    userCount: number;
    activeCount: number;
    alertCount: number;
}

export default function AdminDashboardPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            if (authLoading) return;
            try {
                // 1. 企業総数とステータス別内訳
                const { data: companies, error: compErr } = await supabase
                    .from('companies')
                    .select('status');
                if (compErr) throw compErr;

                // 2. 総ユーザー数
                const { count: userCount, error: userErr } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });
                if (userErr) throw userErr;

                // 3. アラート（30日以上更新がない企業など）
                // ※ ここでは簡易的に、最終更新が30日以前の企業をカウント（updated_atを使用）
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { count: alertCount } = await supabase
                    .from('companies')
                    .select('*', { count: 'exact', head: true })
                    .lt('updated_at', thirtyDaysAgo.toISOString());

                setStats({
                    companyCount: companies?.length || 0,
                    userCount: userCount || 0,
                    activeCount: companies?.filter(c => c.status === 'active').length || 0,
                    alertCount: alertCount || 0
                });
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [supabase, authLoading]);

    if (loading || authLoading) {
        return <Loading fullScreen message="統計情報を集計しています..." />;
    }

    const cards = [
        {
            label: "契約企業数",
            value: stats?.companyCount.toLocaleString() || "0",
            unit: "社",
            change: `内 active ${stats?.activeCount}`,
            icon: Building2,
            trend: "up",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            label: "総ユーザー数",
            value: stats?.userCount.toLocaleString() || "0",
            unit: "名",
            change: "全テナント合計",
            icon: Users,
            trend: "up",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            label: "アクティブ率",
            value: stats?.companyCount ? Math.round((stats.activeCount / stats.companyCount) * 100).toString() : "0",
            unit: "%",
            change: "Active / Total",
            icon: TrendingUp,
            trend: "up",
            color: "text-teal",
            bg: "bg-teal/5"
        },
        {
            label: "要フォロー企業",
            value: stats?.alertCount.toLocaleString() || "0",
            unit: "社",
            change: "30日以上未更新",
            icon: AlertCircle,
            trend: stats?.alertCount && stats.alertCount > 0 ? "up" : "down",
            color: stats?.alertCount && stats.alertCount > 0 ? "text-rose-500" : "text-slate-400",
            bg: stats?.alertCount && stats.alertCount > 0 ? "bg-rose-50" : "bg-slate-50"
        },
    ];

    return (
        <main className="p-8 space-y-10 animate-fadeIn">
            <header className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">全体サマリー</h1>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">実データ連携済み</Badge>
                        </div>
                        <p className="text-slate-500 font-medium font-sans text-left">全導入企業の利用状況と主要KPIをリアルタイムに把握します。</p>
                    </div>
                    <button 
                        onClick={() => setShowPlanModal(true)}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 group whitespace-nowrap"
                    >
                        <PieChart className="w-4 h-4 text-slate-400 group-hover:text-teal transition-colors" />
                        料金プラン・機能詳細
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {showPlanModal && (
                    <PlanDetailsModal onClose={() => setShowPlanModal(false)} />
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm", stat.bg, stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full",
                                stat.trend === "up" && stat.label !== "要フォロー企業" ? "bg-emerald-50 text-emerald-500" :
                                    stat.label === "要フォロー企業" && stat.value !== "0" ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-500"
                            )}>
                                {stat.change}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-800 tabular-nums">{stat.value}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.unit}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-96 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                            <TrendingUp className="w-8 h-8 text-slate-200" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-slate-800">成長トレンド（構築中）</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                各プランごとの MRR 推移や Churn Rate（解約率）を可視化するグラフを準備中です。
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-96 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                            <AlertCircle className="w-8 h-8 text-slate-200" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-slate-800">最新アラート</h3>
                            <div className="mt-4 space-y-2">
                                {stats?.alertCount && stats.alertCount > 0 ? (
                                    <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse">
                                        注意が必要な企業が {stats.alertCount} 社あります。
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                        現在、緊急の対応が必要なアラートはありません。
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
