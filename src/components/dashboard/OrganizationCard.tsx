"use client";

import { useState } from "react";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { Arrow } from "@/components/ui/Arrow";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";

interface KpiItem {
    name: string;
    val: string;
    ach: number | null;
    type: string;
}

interface OrganizationCardProps {
    name: string;
    head: string;
    pulse: number;
    weather: "sun" | "cloud" | "rain";
    arrow: "up" | "down" | "flat";
    kpis: KpiItem[];
    laborCostPerHead?: number;
    isStale?: boolean;
    dataMonth?: string | null;
}

export function OrganizationCard({ name, head, pulse, weather, arrow, kpis, laborCostPerHead, isStale, dataMonth }: OrganizationCardProps) {
    const isNone = pulse === 0;
    const risk = isNone ? "none" : pulse < 2.5 ? "overheat" : pulse >= 3.5 ? "stable" : "caution";
    const pulseColorClass = isNone ? "text-slate-300" : pulse >= 3.5 ? "text-emerald-500" : pulse >= 2.5 ? "text-amber-500" : "text-rose-500";

    // 代表KPIと補助KPIの分離ロジック
    const primaryKpi  = kpis[0] ?? null;
    const secondaryKpis = kpis.slice(1);

    // 補助KPIが4件以上の場合は折りたたみ
    const [showAllKpis, setShowAllKpis] = useState(false);
    const visibleSecondary = showAllKpis ? secondaryKpis : secondaryKpis.slice(0, 2);
    const hiddenCount = secondaryKpis.length - visibleSecondary.length;

    return (
        <div className={cn(
            "rounded-2xl overflow-hidden border transition-all duration-200",
            risk === "overheat" ? "bg-rose-50/20 border-rose-100 shadow-sm" : "bg-white border-slate-100 shadow-sm hover:shadow-md"
        )}>
            {/* Header section */}
            <div className={cn("flex items-center gap-4 px-5 py-4 border-b", risk === "overheat" ? "border-rose-50" : "border-slate-50")}>
                <div className="flex items-center gap-3 min-w-[100px]">
                    <WeatherIcon type={isNone ? "cloud" : weather} size={32} className={isNone ? "opacity-20 grayscale" : ""} />
                    <div>
                        <div className={cn("text-2xl font-extrabold tabular-nums leading-none", pulseColorClass)}>
                            {isNone ? "-" : pulse.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">/5.0 体温</div>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-100" />

                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tighter shrink-0">{head}名</span>
                        {laborCostPerHead && laborCostPerHead > 0 && (
                            <span className="text-[9px] font-bold text-slate-400/60 tracking-tighter bg-slate-50 border border-slate-100/50 px-1.5 py-0.5 rounded-md leading-none shrink-0">
                                {laborCostPerHead.toLocaleString()}万円/人
                            </span>
                        )}
                        <Arrow direction={arrow} />
                    </div>
                </div>

                <Badge className={cn(
                    "border-none text-[10px] font-bold px-3 py-1",
                    risk === "overheat" ? "bg-rose-100 text-rose-500" :
                        risk === "stable" ? "bg-emerald-100 text-emerald-500" :
                            risk === "none" ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-500"
                )}>
                    {risk === "overheat" ? "🔥 オーバーヒート" :
                        risk === "stable" ? "✅ 適温" :
                            risk === "none" ? "😶 未計測" : "⚠️ 要注意"}
                </Badge>
                {/* 前月データ参照中バッジ */}
                {isStale && dataMonth && (
                    <Badge className="border border-slate-200 bg-slate-50 text-slate-400 text-[9px] font-bold px-2 py-1">
                        📅 {dataMonth}参照
                    </Badge>
                )}
            </div>

            {/* KPI Section */}
            {primaryKpi && (
                <div className="divide-y divide-slate-50">
                    <div className="px-5 py-4">
                        {secondaryKpis.length > 0 ? (
                            /* 補助KPIがある場合：左右2カラム */
                            <div className="flex gap-6 items-start">
                                {/* 左：代表KPI（大） */}
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                            {primaryKpi.name}
                                        </span>
                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                            {primaryKpi.type === "stack" ? "積上" : primaryKpi.type === "rate" ? "率" : "抑制"}
                                        </span>
                                        <span className="text-[9px] text-teal font-black bg-teal/5 px-1.5 py-0.5 rounded-md">
                                            代表指標
                                        </span>
                                    </div>
                                    <div className="flex items-end justify-between gap-2">
                                        <div className="text-2xl font-black text-slate-800 tabular-nums leading-tight">
                                            {primaryKpi.val}
                                        </div>
                                        {primaryKpi.ach !== null && (
                                            <div className={cn(
                                                "text-3xl font-black tabular-nums shrink-0",
                                                primaryKpi.ach >= 100 ? "text-emerald-500" : primaryKpi.ach >= 80 ? "text-amber-500" : "text-rose-500"
                                            )}>
                                                {primaryKpi.ach}%
                                            </div>
                                        )}
                                    </div>
                                    {primaryKpi.ach !== null && (
                                        <div className="space-y-1 pt-1">
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        primaryKpi.ach >= 100 ? "bg-emerald-400" : primaryKpi.ach >= 80 ? "bg-amber-400" : "bg-rose-400"
                                                    )}
                                                    style={{ width: `${Math.min(primaryKpi.ach, 120) / 1.2}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 縦区切り */}
                                <div className="w-px self-stretch bg-slate-100 shrink-0" />

                                {/* 右：補助KPI（中サイズ・縦並び） */}
                                <div className="flex flex-col gap-3 shrink-0 w-[220px]">
                                    {visibleSecondary.map((k, i) => {
                                        const achColor = k.ach === null ? "text-slate-400"
                                            : k.ach >= 100 ? "text-emerald-500"
                                            : k.ach >= 80  ? "text-amber-500"
                                            : "text-rose-500";
                                        const achBg = k.ach === null ? "bg-slate-200"
                                            : k.ach >= 100 ? "bg-emerald-400"
                                            : k.ach >= 80  ? "bg-amber-400"
                                            : "bg-rose-400";
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 tracking-tight truncate">
                                                        {k.name}
                                                    </span>
                                                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                                                        {k.type === "stack" ? "積上" : k.type === "rate" ? "率" : "抑制"}
                                                    </span>
                                                </div>
                                                <div className="flex items-end justify-between gap-2">
                                                    <span className="text-sm font-black text-slate-700 tabular-nums">
                                                        {k.val}
                                                    </span>
                                                    {k.ach !== null && (
                                                        <span className={cn("text-xs font-black tabular-nums shrink-0", achColor)}>
                                                            {k.ach}%
                                                        </span>
                                                    )}
                                                </div>
                                                {k.ach !== null && (
                                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000", achBg)}
                                                            style={{ width: `${Math.min(k.ach, 120) / 1.2}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* 折りたたみボタン */}
                                    {hiddenCount > 0 && (
                                        <button
                                            onClick={() => setShowAllKpis(true)}
                                            className="text-[10px] font-black text-teal bg-teal/5 border border-teal/10 px-3 py-1.5 rounded-xl hover:bg-teal/10 transition-colors text-left"
                                        >
                                            +{hiddenCount}件を表示
                                        </button>
                                    )}
                                    {showAllKpis && secondaryKpis.length > 2 && (
                                        <button
                                            onClick={() => setShowAllKpis(false)}
                                            className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors text-left"
                                        >
                                            折りたたむ
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* 補助KPIがない場合：既存の1カラムレイアウト（変更なし） */
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                            {primaryKpi.name}
                                        </span>
                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                            {primaryKpi.type === "stack" ? "積上" : primaryKpi.type === "rate" ? "率" : "抑制"}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 tabular-nums leading-tight">
                                        {primaryKpi.val}
                                    </div>
                                    {primaryKpi.ach !== null && (
                                        <div className="space-y-1 pt-1 max-w-[240px]">
                                            <div className="flex justify-between items-center text-[9px] font-bold tracking-tight">
                                                <span className="text-slate-400">達成率</span>
                                                <span className={cn(
                                                    primaryKpi.ach >= 100 ? "text-emerald-500" : primaryKpi.ach >= 80 ? "text-amber-500" : "text-rose-500"
                                                )}>{primaryKpi.ach}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        primaryKpi.ach >= 100 ? "bg-emerald-400" : primaryKpi.ach >= 80 ? "bg-amber-400" : "bg-rose-400"
                                                    )}
                                                    style={{ width: `${Math.min(primaryKpi.ach, 120) / 1.2}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {primaryKpi.ach !== null && (
                                    <div className={cn(
                                        "text-3xl font-black tabular-nums shrink-0",
                                        primaryKpi.ach >= 100 ? "text-emerald-500" : primaryKpi.ach >= 80 ? "text-amber-500" : "text-rose-500"
                                    )}>
                                        {primaryKpi.ach}%
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 観察コメント */}
                    <ObservationComment pulse={pulse} primaryAch={primaryKpi.ach} />
                </div>
            )}
        </div>
    );
}

function ObservationComment({ pulse, primaryAch }: { pulse: number; primaryAch: number | null }) {
    if (pulse === 0 || primaryAch === null) return null;

    const achieved = primaryAch >= 100;
    const warming  = primaryAch >= 80;
    const pulseHigh = pulse >= 3.8;
    const pulseMid  = pulse >= 3.0;

    let text = "";

    if (pulseHigh && achieved) {
        text = "体温・達成率ともに好調。何が機能しているか言語化して共有する好機かもしれません。";
    } else if (pulseHigh && warming) {
        text = "体温は良好。あと一歩の達成に向けて、何か環境面でサポートできることはないでしょうか。";
    } else if (pulseHigh && !warming) {
        text = "体温は整っています。KPIの目標設定や外部環境について、チームで話し合ってみる価値があるかも。";
    } else if (pulseMid && achieved) {
        text = "達成できています。最近の体温の変化も観察しておくと、先手が打てるかもしれません。";
    } else if (pulseMid && warming) {
        text = "着実に進んでいます。達成まであと一歩、何かサポートできることはないでしょうか。";
    } else if (pulseMid && !warming) {
        text = "体温・達成率ともに踏ん張りどころ。背景について一緒に考えるタイミングかもしれません。";
    } else if (!pulseMid && achieved) {
        text = "達成していますが、体温が下がり気味です。チームの負担について話を聞いてみませんか。";
    } else {
        text = "体温と達成率の両面から、この部署の状況を一緒に確認してみませんか。";
    }

    return (
        <div className="px-5 py-3 border-t border-slate-50">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                💬 {text}
            </p>
        </div>
    );
}
