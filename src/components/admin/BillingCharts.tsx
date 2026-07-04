"use client";

// 課金ダッシュボードのチャート群。recharts を初期チャンクから外すため、
// admin/billing/page.tsx から next/dynamic({ ssr:false }) で遅延ロードする。

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
    Legend,
} from "recharts";

/** MRR 推移（エリアチャート） */
export function MrrTrendChart({ chartData }: { chartData: any[] }) {
    return (
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
    );
}

/** プラン別社数推移（折れ線） */
export function PlanDistributionChart({ chartData, planColors }: { chartData: any[]; planColors: Record<string, string> }) {
    return (
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
                <Line type="monotone" dataKey="Pro" stroke={planColors.Pro} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Standard" stroke={planColors.Standard} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Team" stroke={planColors.Team} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Free" stroke={planColors.Free} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}
