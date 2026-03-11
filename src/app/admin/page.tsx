"use client";

import { Badge } from "@/components/ui/Badge";
import {
    Building2,
    Users,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <main className="p-8 space-y-10 animate-fadeIn">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">全体サマリー</h1>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">システム正常運用中</Badge>
                </div>
                <p className="text-slate-500 font-medium font-sans">全導入企業の利用状況と主要KPIを一括で把握します。</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "契約企業数", value: "24", unit: "社", change: "+2", icon: Building2, trend: "up" },
                    { label: "総ユーザー数", value: "1,248", unit: "名", change: "+124", icon: Users, trend: "up" },
                    { label: "推定 MRR", value: "480", unit: "万円", change: "+35", icon: TrendingUp, trend: "up" },
                    { label: "警告アラート", value: "3", unit: "件", change: "-1", icon: AlertCircle, trend: "down" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal group-hover:text-white transition-colors">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full",
                                stat.trend === "up" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                            )}>
                                {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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

            {/* Main Content Area (Layout Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-96 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">成長トレンド（構築中）</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">MRR と解約率の推移グラフがここに表示されます。</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-96 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">最新アラート（構築中）</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">解約リスクの高い企業や、未解決のサポート依頼が表示されます。</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// cn をインポートするために一時的に追加 (後で整理)
import { cn } from "@/lib/utils";
