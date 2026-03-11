"use client";

import { TabBar } from "@/components/ui/TabBar";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { ProductInsight } from "@/components/dashboard/ProductInsight";
import { FeedbackItem } from "@/components/dashboard/FeedbackItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Package } from "lucide-react";

interface OrganizationSectionProps {
    secondaryAxisName: string;
    orgView: string;
    setOrgView: (id: any) => void;
    displayDepts: any[];
    displayAxes: any[];
}

export function OrganizationSection({
    secondaryAxisName,
    orgView,
    setOrgView,
    displayDepts,
    displayAxes,
}: OrganizationSectionProps) {
    return (
        <div className="space-y-6">
            <TabBar
                tabs={[{ id: "dept", label: "🏢 部署別" }, { id: "product", label: `📦 ${secondaryAxisName}別` }]}
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
                        <span className="text-lg">🔗</span>
                        <h3 className="text-sm font-bold text-slate-800">{secondaryAxisName}間の比較分析（AI）</h3>
                    </div>
                    <div className="space-y-3">
                        <ProductInsight
                            name="プロダクトA"
                            tag="Star"
                            type="star"
                            text="全指標で目標超過かつ体温良好。成功パターンが確立されている。このチームのナレッジをBに展開することで、組織全体の底上げが見込める。"
                        />
                        <ProductInsight
                            name="プロダクトB"
                            tag="Dog"
                            type="dog"
                            text="解約率8.1%は危険水域。14名のリソースに対してMRR520万は効率が悪い。教育体制の不備か、ターゲットとのミスマッチが疑われる。組織方針では「3月末まで改善なければピボット検討」と記載あり。期限まで残り1ヶ月。"
                        />
                        <ProductInsight
                            name="プロダクトC"
                            tag="Question Mark → Star候補"
                            type="question"
                            text="9名で一人当たりMRRが最高値。体温4.3は全プロダクト中1位。プロダクトBからの配置転換2〜3名で、さらにスケールする可能性がある。"
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔗</span>
                        <h3 className="text-sm font-bold text-slate-800">部署間フィードバック（AIサマリー）</h3>
                    </div>
                    <div className="space-y-2">
                        <FeedbackItem from="営業" to="マーケ" type="positive" text="リードの質が改善傾向。ターゲティング精度の向上が商談の質に好影響を与えている。" />
                        <FeedbackItem from="営業" to="開発" type="warning" text="仕様変更の頻度と突発性が提案資料の手戻りを生んでおり、営業部の体温低下の一因になっている可能性がある。" />
                        <FeedbackItem from="CS" to="開発" type="alert" text="バグ対応の優先順位が不透明で、顧客への説明に窮する場面が増えているとの声が複数あがっている。" />
                        <FeedbackItem from="開発" to="全社" type="info" text="承認フローの3段階構造が開発速度のボトルネックとして最も多く挙げられている。短縮の検討を推奨。" />
                    </div>
                </div>
            )}
        </div>
    );
}
