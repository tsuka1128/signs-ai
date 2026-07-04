"use client";

// 部署マネジメント画面のチャート群。recharts を初期チャンクから外すため、
// dept/page.tsx から next/dynamic({ ssr:false }) で遅延ロードする。

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";

interface DeptScore {
    label: string;
    respondentCount: number;
    headcount: number;
    [key: string]: any;
}

/** 回答数・回答率の推移（棒＋折れ線） */
export function ResponseTrendChart({ deptScores }: { deptScores: DeptScore[] }) {
    return (
        <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={deptScores.map(s => ({
                ...s,
                rate: s.headcount > 0 ? Math.round((s.respondentCount / s.headcount) * 100) : null,
            }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} fontWeight="bold" width={20} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontWeight="bold" domain={[0, 100]} width={28} />
                <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                    formatter={(value: any, name: any, props: any) => {
                        if (name === 'respondentCount') return [`${value} 人`, '回答数'];
                        if (name === 'rate') {
                            const hc = props.payload?.headcount;
                            if (hc === 0) return ['—', '回答率'];
                            return [`${value} %`, '回答率'];
                        }
                        return [value, name];
                    }}
                />
                <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
                <Bar yAxisId="left" dataKey="respondentCount" name="回答数" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="回答率" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/** 体温プロフィール（レーダー：自部署 vs 全社平均） */
export function ThermometerRadarChart({ radarData, showCompany }: { radarData: any[]; showCompany: boolean }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight="bold" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} stroke="#cbd5e1" fontSize={10} />
                <Radar name="自部署" dataKey="dept" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} strokeWidth={2} />
                {showCompany && (
                    <Radar name="全社平均" dataKey="company" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="3 3" />
                )}
                <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                    formatter={(value: any) => [`${value} / 5.00`]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
            </RadarChart>
        </ResponsiveContainer>
    );
}
