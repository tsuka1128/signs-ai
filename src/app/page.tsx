"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { TabBar } from "@/components/ui/TabBar";
import { DeepReport } from "@/components/dashboard/DeepReport";
import { ActionSection } from "@/components/dashboard/sections/ActionSection";
import { SemanticSection } from "@/components/dashboard/sections/SemanticSection";
import { SurveySection } from "@/components/dashboard/sections/SurveySection";
import { OrganizationSection } from "@/components/dashboard/sections/OrganizationSection";
import { KpiSection } from "@/components/dashboard/sections/KpiSection";
import { MatrixSection } from "@/components/dashboard/sections/MatrixSection";
import { LaborFinanceSection } from "@/components/dashboard/sections/LaborFinanceSection";
import { ReportSection } from "@/components/dashboard/sections/ReportSection";
import { TrialGuard } from "@/components/layout/TrialGuard";
import { cn } from "@/lib/utils";
import { Target, Thermometer, Shield, AlertTriangle, Lightbulb, Rocket } from "lucide-react";
import { PlanGate } from "@/components/ui/PlanGate";
import { DEFAULT_SURVEY_QUESTIONS, DEFAULT_SEMANTIC_POLICY } from "@/lib/constants";
import { useCompany } from "@/hooks/useCompany";
import { Loading } from "@/components/ui/Loading";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Department } from "@/types/database";
import { getWeatherFromPulse } from "@/lib/logic/kpi-engine";

export default function DashboardPage() {
  const [tab, setTab] = useState<string>("all");
  const [sec, setSec] = useState("matrix");
  const [matView, setMatView] = useState("dept");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");
  const [month, setMonth] = useState("default");
  const [showDeepReport, setShowDeepReport] = useState(false);

  const { company, loading: authLoading, supabase } = useCompany();
  const { state, derived, handlers } = useDashboardData(company, supabase);

  const latestAi = state.realAiInsights[0];
  const aiContent = state.aiContent;
  const secondaryAxisName = company?.secondary_axis_name || "プロダクト";

  // Derived current metrics based on UI state
  const currentSurveyData = useMemo(() => derived.currentSurveyData(orgView), [derived, orgView]);

  const ins = useMemo(() => {
    const pulse = currentSurveyData.pulse;
    const prevPulse = currentSurveyData.pulseHistory[11] || 0;
    const weather = getWeatherFromPulse(pulse);
    const trend = pulse > prevPulse ? "up" : pulse < prevPulse ? "down" : "flat";

    if (tab === "all") {
      return {
        title: "全社",
        tone: "戦略的分析",
        text: aiContent?.summary || (currentSurveyData.pulse > 0 ? currentSurveyData.aiComment : "組織方針に基づき、各部署の体温スコアとKPI達成状況を俯瞰的に分析します。現在、実データの蓄積を開始した段階です。"),
        weather,
        trend
      };
    }
    const dept = state.realDepts.find(d => d.id === tab);
    if (!dept) return { title: "全社", tone: "戦略的分析", text: "", weather, trend };
    
    const deptInsight = aiContent?.insights_by_dept?.[dept.id];
    const deptIdx = state.realDepts.findIndex(d => d.id === tab);

    return {
      title: dept.name,
      tone: deptInsight?.tone || ["前向き・行動喚起", "冷静・品質重視", "共感・伴走", "構造的・警告的"][deptIdx % 4],
      text: deptInsight?.text || `「${dept.name}」の直近の体温とKPI達成状況に基づく分析です。AIによる分析を実行すると専用の診断テキストが表示されます。`,
      weather,
      trend
    };
  }, [tab, state.realDepts, currentSurveyData, aiContent]);

  const selectedKpiDef = derived.displayKpis.find((k: any) => k.id === selKpi) || derived.displayKpis[0];
  const achRate = useMemo(() => {
    if (!selectedKpiDef || !selectedKpiDef.target) return null;
    const v = Number(selectedKpiDef.val);
    const t = Number(selectedKpiDef.target);
    if (isNaN(v) || isNaN(t) || t <= 0) return 0;
    return Math.round((v / t) * 100);
  }, [selectedKpiDef]);

  const sizeKpiName = useMemo(() => {
    if (matView === "dept") return "KPI達成率";
    const kpiDef = state.realKpis.find(k => k.id === company?.secondary_axis_size_kpi_id);
    return kpiDef ? kpiDef.name : "MRRの大きさ";
  }, [matView, company, state.realKpis]);

  const currentMatData = useMemo(() => {
    const monthsMap: Record<string, number> = {
      "default": 12, "1m": 11, "3m": 9, "6m": 6, "12m": 0
    };
    const targetIdx = monthsMap[month] ?? 12;

    return (matView === "product" ? derived.displayAxes : derived.displayDepts).map((d: any) => {
      const pulseAtMonth = d.pulseHistory?.[targetIdx] || 0;
      const headAtMonth = d.headHistory?.[targetIdx] || 0;
      const prodAtMonth = d.productivityHistory?.[targetIdx] || 100;
      const sizeAtMonth = (matView === "product" && d.sizeHistory) ? d.sizeHistory[targetIdx] : 100;

      let head = headAtMonth;
      if (head === 0) {
        if (matView === "dept") {
          const deptDef = state.realDepts.find(rd => rd.id === d.id);
          head = deptDef?.headcount || 0;
        } else {
          head = d.xAxisHead || 0;
        }
      }

      return {
        ...d,
        head,
        productivity: prodAtMonth,
        pulse: pulseAtMonth || d.pulse,
        weather: getWeatherFromPulse(pulseAtMonth || d.pulse),
        mrr: sizeAtMonth,
        sizeValue: sizeAtMonth
      };
    });
  }, [matView, month, derived.displayAxes, derived.displayDepts, state.realDepts]);

  if (authLoading) return <Loading fullScreen message="データを準備しています..." />;
  if (!company) return null;

  return (
    <AppLayout 
      currentSection={sec} 
      onSectionChange={setSec} 
      hasLaborData={state.hasLaborData}
    >
      <TrialGuard>
        <div className="space-y-10">
          {sec !== "report" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <TabBar tabs={derived.deptTabs} active={tab} onChange={setTab} />
              </div>

              <div className="space-y-4">
                <MainInsightCard
                  title={ins.title}
                  tone={ins.tone}
                  text={ins.text}
                  weather={ins.weather as any}
                  trend={ins.trend as any}
                  onOpenDeepReport={tab === "all" ? () => setSec("report") : undefined}
                />

                {tab !== "all" && (() => {
                  const dept = state.realDepts.find(d => d.id === tab);
                  if (!dept) return null;
                  return (
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 mb-3">
                        <h5 className="text-xs font-bold text-slate-700">AI方針翻訳 — {dept.name}</h5>
                        <span className="text-[9px] text-white font-bold px-2 py-0.5 bg-teal/80 rounded-full shadow-sm shadow-teal/20">最新の通知</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        ※現在AIエンジン未接続です。フェーズ7以降、ここに「{dept.name}」の直近のコンディション（体温）と全社方針を掛け合わせた、専用の翻訳メッセージが毎月自動生成されます。
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="animate-fadeIn">
          {sec === "matrix" && (
            <MatrixSection
              secondaryAxisName={secondaryAxisName}
              sizeKpiName={sizeKpiName}
              matView={matView}
              setMatView={setMatView}
              month={month}
              setMonth={setMonth}
              currentMatData={currentMatData}
              aiContent={aiContent}
              hasLaborData={state.hasLaborData}
            />
          )}

          {sec === "finance" && (
            <PlanGate feature="labor_analytics" requiredPlan="Pro">
              <LaborFinanceSection
                laborRoi={state.laborRoi}
                laborDistRate={state.laborDistRate}
                totalLaborCost={state.totalLaborCost}
                deptFinanceData={state.deptFinanceData}
                avgLaborCostPerHead={state.avgLaborCostPerHead}
                aiContent={aiContent}
              />
            </PlanGate>
          )}

          {sec === "kpi" && (
            <KpiSection
              displayKpis={derived.displayKpis}
              selKpi={selKpi}
              setSelKpi={setSelKpi}
              selectedKpiDef={selectedKpiDef}
              achRate={achRate}
              monthLabels={state.monthLabels}
              fullMonthLabels={state.fullMonthLabels}
            />
          )}

          {sec === "org" && (
            <OrganizationSection
              secondaryAxisName={secondaryAxisName}
              orgView={orgView}
              setOrgView={setOrgView}
              displayDepts={derived.displayDepts}
              displayAxes={derived.displayAxes}
              aiContent={aiContent}
            />
          )}

          {sec === "survey" && (
            <SurveySection
              data={currentSurveyData}
              secondaryAxisName={secondaryAxisName}
              matView={matView}
              setMatView={setMatView}
              realDepts={state.realDepts}
              realAxes={state.realAxes}
              orgView={orgView}
              setOrgView={setOrgView}
              monthLabels={state.monthLabels}
              questions={DEFAULT_SURVEY_QUESTIONS}
            />
          )}

          {sec === "action" && (
            <ActionSection actions={state.realActionItems} depts={state.realDepts} />
          )}

          {sec === "semantic" && (
            <SemanticSection
              displaySem={state.realSem || DEFAULT_SEMANTIC_POLICY}
              realSemHistory={state.realSemHistory}
              realDepts={state.realDepts}
              actions={[]}
              onSave={handlers.handleSaveSemantic}
              onDelete={handlers.handleDeleteSemantic}
              aiContent={aiContent}
            />
          )}

          {sec === "report" && (
            <ReportSection
              generatedAt={latestAi ? new Date(latestAi.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
              sections={[
                {
                  id: "executive-summary",
                  icon: <Target className="w-5 h-5" />,
                  title: "総評：組織の健全性と戦略進捗",
                  subtitle: "Executive Summary",
                  content: aiContent?.deep_report?.executive_summary || "データに基づいた総評を分析中です..."
                },
                {
                  id: "correlation",
                  icon: <Thermometer className="w-5 h-5" />,
                  title: "組織力とKPIの相関解析",
                  subtitle: "Organizational Health × KPI Correlation",
                  content: aiContent?.deep_report?.correlation || "相関の分析データを準備中です..."
                },
                {
                  id: "strategic-alignment",
                  icon: <Shield className="w-5 h-5" />,
                  title: "組織方針との整合性チェック",
                  subtitle: "Strategic Alignment",
                  content: aiContent?.deep_report?.strategic_alignment || "方針との整合性を検証中です..."
                },
                {
                  id: "risks",
                  icon: <AlertTriangle className="w-5 h-5" />,
                  title: "リスクと成長機会の特定",
                  subtitle: "Risks & Opportunities",
                  content: aiContent?.deep_report?.risks || "リスク項目を抽出中です..."
                },
                {
                  id: "recommendations",
                  icon: <Lightbulb className="w-5 h-5" />,
                  title: "経営判断への具体的提言",
                  subtitle: "Actionable Recommendations",
                  content: aiContent?.deep_report?.recommendations || "提言を生成中です..."
                }
              ]}
            />
          )}
        </div>
      </div>
    </TrialGuard>

    </AppLayout>
  );
}
