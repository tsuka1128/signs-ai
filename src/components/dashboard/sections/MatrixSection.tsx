"use client";

import { useMemo, useState } from "react";
import { TabBar } from "@/components/ui/TabBar";
import { ScatterPlot } from "@/components/dashboard/ScatterPlot";
import { EmptyState } from "@/components/ui/EmptyState";
import { AreaChart, Lightbulb, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { HelpLink } from "@/components/ui/HelpLink";

interface MatrixSectionProps {
    secondaryAxisName: string;
    sizeKpiName: string;
    matView: string;
    setMatView: (view: string) => void;
    month: string;
    setMonth: (m: string) => void;
    currentMatData: any[];
    aiContent?: any;
    hasLaborData?: boolean;
}


export function MatrixSection({
    secondaryAxisName,
    sizeKpiName,
    matView,
    setMatView,
    month,
    setMonth,
    currentMatData,
    aiContent,
    hasLaborData
}: MatrixSectionProps) {
    const [sizeBase, setSizeBase] = useState<"kpi" | "labor">("kpi");

    const scatterData = useMemo(() => {
        return currentMatData.map(d => ({
            ...d,
            sizeValue: sizeBase === "labor" ? d.totalLaborCost : d.sizeValue
        }));
    }, [currentMatData, sizeBase]);

    const displaySizeKpiName = sizeBase === "labor" ? "人件費の大きさ" : sizeKpiName;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">部署 / {secondaryAxisName} マトリックス</h3>
                                <HelpLink href="/docs/bubble-chart-guide" label="見方を確認" />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                <div className="flex items-center gap-1">
                                    <span>縦軸: 一人当たり生産性</span>
                                    <div className="relative group/calc text-left">
                                        <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors select-none">?</button>
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block z-[150] normal-case tracking-normal animate-in fade-in zoom-in-95 font-medium">
                                            <div className="font-bold text-white mb-2 flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-emerald-400" />生産性スコアの計算式</div>
                                            <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[9px] text-emerald-400 mb-2.5 border border-slate-700">
                                                主担当KPIの達成率 × 体温係数
                                            </div>
                                            <div className="text-slate-200">
                                                ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化、。<br />
                                                そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、部署を同列の軸で評価します。
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span>｜ 横軸: {matView === "product" ? "所属人数" : "リソース量"} ｜ 円サイズ: {displaySizeKpiName}</span>
                            </div>
                        </div>
                        {hasLaborData && (
                            <div className="flex bg-slate-100/60 p-0.5 rounded-full self-start md:self-auto">
                                <button
                                    onClick={() => setSizeBase("kpi")}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                        sizeBase === "kpi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-500"
                                    )}
                                >
                                    重視: 達成率
                                </button>
                                <button
                                    onClick={() => setSizeBase("labor")}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                        sizeBase === "labor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-500"
                                    )}
                                >
                                    重視: 人件費
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <TabBar
                            tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
                            active={matView}
                            onChange={setMatView}
                            className="w-auto"
                        />
                        <div className="flex items-center gap-2 md:border-l border-slate-200 md:pl-3">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase hidden md:inline">Time Lapse</span>
                            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full">
                                <button onClick={() => setMonth("default")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "default" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>現在</button>
                                <button onClick={() => setMonth("1m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "1m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1ヶ月前</button>
                                <button onClick={() => setMonth("3m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "3m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>3ヶ月前</button>
                                <button onClick={() => setMonth("6m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "6m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>6ヶ月前</button>
                                <button onClick={() => setMonth("12m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "12m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1年前</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-4">
                    {currentMatData.length > 0 ? (
                        <ScatterPlot
                            data={scatterData}
                            isProduct={matView === "product"}
                            sizeKpiName={displaySizeKpiName}
                            month={month}
                            onMonthChange={setMonth}
                            onProductToggle={(isProd) => setMatView(isProd ? "product" : "dept")}
                        />
                    ) : (
                        <EmptyState
                            title="分析データが十分にありません"
                            description="マトリックス分析を表示するには、複数の部署のデータとKPI実績が必要です。アンケート回答やKPI入力が進むと、ここに組織のコンディションがプロットされます。"
                            actionLabel="数値を入力する"
                            actionHref="/kpi"
                            icon={<AreaChart className="w-12 h-12 text-slate-200" />}
                        />
                    )}
                </div>

                {/* ヘルプテキスト */}
                <div className="mt-4 flex items-center justify-end gap-2 text-right">
                    {month === "default" ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold">タイムラプスで組織の変化を確認できます</p>
                        </>
                    ) : (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <p className="text-[10px] text-teal-600 font-bold">過去データを表示中</p>
                        </>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-l-4 border-teal shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-slate-800">AIのマトリックス分析</h4>
                </div>
                <div className="text-xs leading-loose text-slate-600 font-medium">
                    {month !== "default" ? (
                        aiContent?.matrix_analysis?.[month] ? (
                            <div className="space-y-4">
                                <p><strong>{aiContent.matrix_analysis[month].past_record.split("】")[0] + "】"}</strong> {aiContent.matrix_analysis[month].past_record.split("】")[1]?.trim()}</p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                    <p><strong>{aiContent.matrix_analysis[month].change.split("】")[0] + "】"}</strong> {aiContent.matrix_analysis[month].change.split("】")[1]?.trim()}</p>
                                    <p className="text-slate-500 font-bold">
                                        {aiContent.matrix_analysis[month].retrospective}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-slate-400 italic">過去の分析データが見つかりませんでした。AI分析を再実行してください。</p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p><strong>【現在のAI組織分析】</strong> {aiContent?.summary || "最新のアンケートとKPIデータを統合した分析を表示します。"}</p>
                            {aiContent?.deep_report?.executive_summary && (
                                <div className="bg-teal/5 p-4 rounded-xl border border-teal/10 space-y-2">
                                    <div className="flex items-center gap-2 text-teal font-black text-[10px] uppercase tracking-widest">
                                        <Lightbulb className="w-3.5 h-3.5" />
                                        経営への提言
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                        {aiContent.deep_report.executive_summary}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
