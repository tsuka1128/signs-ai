"use client";

import { TabBar } from "@/components/ui/TabBar";
import { AxisComparisonSection } from "@/components/dashboard/AxisComparisonSection";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface OrganizationSectionProps {
    secondaryAxisName: string;
    orgView: string;
    setOrgView: (id: any) => void;
    displayDepts: any[];
    displayAxes: any[];
    aiContent?: any;
}

export function OrganizationSection({
    secondaryAxisName,
    orgView,
    setOrgView,
    displayDepts,
    displayAxes,
    aiContent
}: OrganizationSectionProps) {
    // displayDepts から計算
    const avgPulse = displayDepts.filter(d => d.pulse > 0).length > 0
        ? (displayDepts.filter(d => d.pulse > 0).reduce((s, d) => s + d.pulse, 0) / displayDepts.filter(d => d.pulse > 0).length).toFixed(1)
        : "-";

    const stableCount  = displayDepts.filter(d => d.pulse >= 3.5).length;
    const cautionCount = displayDepts.filter(d => d.pulse > 0 && d.pulse < 3.5).length;

    // 全KPIの平均達成率（null除外）
    const achRates = displayDepts.flatMap(d => (d.kpis || []).map((k: any) => k.ach)).filter((v: any) => v !== null && v !== undefined);
    const avgAch = achRates.length > 0
        ? Math.round(achRates.reduce((s: number, v: number) => s + v, 0) / achRates.length)
        : null;

    return (
        <div className="space-y-6">
            {/* 上層：全社俯瞰ストリップ */}
            {displayDepts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex flex-wrap items-center gap-6 text-sm mb-2">
                    {/* 全社平均体温 */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">全社平均体温</span>
                        <span className="text-lg font-black text-emerald-500 tabular-nums">{avgPulse}</span>
                        <span className="text-[10px] text-slate-300 font-bold">/5.0</span>
                    </div>

                    <div className="w-px h-5 bg-slate-100" />

                    {/* 全社平均達成率 */}
                    {avgAch !== null && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">平均達成率</span>
                                <span className={cn(
                                    "text-lg font-black tabular-nums",
                                    avgAch >= 100 ? "text-emerald-500" : avgAch >= 80 ? "text-amber-500" : "text-rose-500"
                                )}>{avgAch}%</span>
                            </div>
                            <div className="w-px h-5 bg-slate-100" />
                        </>
                    )}

                    {/* 部署別状態カウント */}
                    <div className="flex items-center gap-3">
                        {stableCount > 0 && (
                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                ✅ 適温 {stableCount}部署
                            </span>
                        )}
                        {cautionCount > 0 && (
                            <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                ⚠️ 注目 {cautionCount}部署
                            </span>
                        )}
                    </div>

                    {/* AI サマリーコメント（全文表示） */}
                    {aiContent?.summary && (
                        <>
                            <div className="w-px h-5 bg-slate-100 hidden md:block" />
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed hidden md:block flex-1">
                                💭 {aiContent.summary}
                            </p>
                        </>
                    )}
                </div>
            )}

            <TabBar
                tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
                active={orgView}
                onChange={setOrgView}
            />

            <div className="space-y-4 pt-2">
                {orgView === "dept" ? (
                    /* 部署別：既存のカード一覧（変更なし） */
                    displayDepts.length > 0 ? (
                        displayDepts.map((d: any, i: number) => (
                            <OrganizationCard key={i} {...d} />
                        ))
                    ) : (
                        <EmptyState
                            title="部署が登録されていません"
                            description="部署を登録することで、組織ごとの熱量やKPIを可視化できます。"
                            actionLabel="設定を開く"
                            actionHref="/onboarding"
                            icon={<Users className="w-12 h-12 text-slate-200" />}
                        />
                    )
                ) : (
                    /* 担当領域別：新しい比較分析ビュー */
                    <AxisComparisonSection
                        axes={displayAxes}
                        secondaryAxisName={secondaryAxisName}
                        aiContent={aiContent}
                    />
                )}
            </div>

            {/* 「組織として話したいこと」は部署マネジメント (/dept) に移動 */}
        </div>
    );
}
