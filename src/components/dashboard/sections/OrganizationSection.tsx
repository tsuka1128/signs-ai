"use client";

import { TabBar } from "@/components/ui/TabBar";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { ProductInsight } from "@/components/dashboard/ProductInsight";
import { FeedbackItem } from "@/components/dashboard/FeedbackItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Package, Link2 } from "lucide-react";

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
    return (
        <div className="space-y-6">
            <TabBar
                tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
                active={orgView}
                onChange={setOrgView}
            />
            <div className="space-y-4 pt-2">
                {(orgView === "dept" ? displayDepts : displayAxes).length > 0 ? (
                    (orgView === "dept" ? displayDepts : displayAxes).map((d: any, i: number) => (
                        <OrganizationCard
                            key={i}
                            name={d.name}
                            head={d.head}
                            pulse={d.pulse}
                            weather={d.weather}
                            arrow={d.arrow || "flat"}
                            kpis={d.kpis}
                        />
                    ))
                ) : (
                    <EmptyState
                        title={orgView === "dept" ? "部署が登録されていません" : `${secondaryAxisName}が登録されていません`}
                        description={orgView === "dept"
                            ? "部署を登録することで、組織ごとの熱量やKPIを可視化できます。"
                            : `${secondaryAxisName}ごとの分析を行うには、設定から項目を追加してください。`}
                        actionLabel="設定を開く"
                        actionHref="/onboarding" // または /settings
                        icon={orgView === "dept" ? <Users className="w-12 h-12 text-slate-200" /> : <Package className="w-12 h-12 text-slate-200" />}
                    />
                )}
            </div>

            {/* AI Analysis / Feedback Bottom Section */}
            {orgView === "product" ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-teal" />
                        <h3 className="text-sm font-bold text-slate-800">{secondaryAxisName}間の比較分析（AI）</h3>
                    </div>
                    <div className="space-y-3">
                        {aiContent?.deep_report?.strategic_alignment ? (
                            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {aiContent.deep_report.strategic_alignment}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic">比較分析データがありません。</div>
                        )}
                        {/* 将来的には product_insights などをプロンプトから生成させることも可能 */}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-teal" />
                        <h3 className="text-sm font-bold text-slate-800">部署間フィードバック（AIサマリー）</h3>
                    </div>
                    <div className="space-y-2">
                        {aiContent?.department_feedback && aiContent.department_feedback.length > 0 ? (
                            aiContent.department_feedback.map((f: any, i: number) => (
                                <FeedbackItem 
                                    key={i} 
                                    from={f.from_dept} 
                                    to={f.to_dept} 
                                    type={f.type === "positive" || f.type === "warning" || f.type === "alert" || f.type === "info" ? f.type : "info"} 
                                    text={f.text} 
                                />
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 italic">フィードバックデータがありません</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
