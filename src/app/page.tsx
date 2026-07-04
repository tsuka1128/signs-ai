"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { HomeOverview } from "@/components/dashboard/HomeOverview";

// 条件表示（sec=...）のセクションは dynamic import で初期チャンクから外す
const SurveySection = dynamic(() => import("@/components/dashboard/sections/SurveySection").then(m => ({ default: m.SurveySection })), { ssr: false });
const OrganizationSection = dynamic(() => import("@/components/dashboard/sections/OrganizationSection").then(m => ({ default: m.OrganizationSection })), { ssr: false });
const KpiSection = dynamic(() => import("@/components/dashboard/sections/KpiSection").then(m => ({ default: m.KpiSection })), { ssr: false });
const LaborFinanceSection = dynamic(() => import("@/components/dashboard/sections/LaborFinanceSection").then(m => ({ default: m.LaborFinanceSection })), { ssr: false });
const MatrixSection = dynamic(() => import("@/components/dashboard/sections/MatrixSection").then(m => ({ default: m.MatrixSection })), { ssr: false });
const ActionSection = dynamic(() => import("@/components/dashboard/sections/ActionSection").then(m => ({ default: m.ActionSection })), { ssr: false });
const SemanticSection = dynamic(() => import("@/components/dashboard/sections/SemanticSection").then(m => ({ default: m.SemanticSection })), { ssr: false });
const ReportSection = dynamic(() => import("@/components/dashboard/sections/ReportSection").then(m => ({ default: m.ReportSection })), { ssr: false });
import { TrialGuard } from "@/components/layout/TrialGuard";
import { cn } from "@/lib/utils/index";
import { Target, Thermometer, Shield, AlertTriangle, Lightbulb } from "lucide-react";
import { PlanGate } from "@/components/ui/PlanGate";
import { DEFAULT_SURVEY_QUESTIONS, DEFAULT_SEMANTIC_POLICY } from "@/lib/constants";
import { useCompany } from "@/hooks/useCompany";
import { Loading } from "@/components/ui/Loading";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getWeatherFromPulse } from "@/lib/logic/kpi-engine";

export default function DashboardPage() {
  const [tab, setTab] = useState<string>("all");
  const [sec, setSec] = useState("home");
  const [matView, setMatView] = useState("dept");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");

  const { company, loading: authLoading, supabase, isImpersonating, userRole, userDepartmentId } = useCompany();
  const { state, derived, handlers } = useDashboardData(company, supabase, isImpersonating, userRole, userDepartmentId);

  // URLパラメータ sec から初期表示セクションを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSec = params.get('sec');
    if (urlSec) setSec(urlSec);
  }, []);

  // マネージャーの場合、初期表示を「全社」から自部署に切り替える
  useEffect(() => {
    if (userRole === 'manager' && userDepartmentId && tab === 'all') {
      setTab(userDepartmentId);
      setOrgView(userDepartmentId);
    }
  }, [userRole, userDepartmentId, tab]);

  const latestAi = state.realAiInsights[0];
  const aiContent = state.aiContent;
  const secondaryAxisName = company?.secondary_axis_name || "プロダクト";

  // Derived current metrics based on UI state
  const currentSurveyData = useMemo(() => (derived as any).getCurrentSurveyData(orgView), [derived, orgView]);

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

    return {
      title: dept.name,
      tone: deptInsight?.tone || "分析待ち",
      text: deptInsight?.text || (() => {
        const d = derived.displayDepts.find((d: any) => d.id === dept.id);
        if (!d) return "AI分析を実行すると、この部署の専用メッセージが表示されます。";
        const pulseLabel = d.pulse >= 4.0 ? "良好" : d.pulse >= 3.0 ? "標準的" : d.pulse > 0 ? "やや低め" : null;
        const kpiLabel = d.kpiAch >= 100 ? "KPI達成" : d.kpiAch > 0 ? `KPI達成率${d.kpiAch}%` : null;
        if (!pulseLabel) return "AI分析を実行すると、この部署の専用メッセージが表示されます。";
        return `現在「${dept.name}」の体温は${pulseLabel}な水準です。${kpiLabel ? kpiLabel + "。" : ""}AI分析を実行すると、方針を踏まえたより詳細な診断が表示されます。`;
      })(),
      weather,
      trend
    };
  }, [tab, state.realDepts, currentSurveyData, aiContent]);

  // 全社体温（getCurrentSurveyData("all") は重いので1回だけ計算し、insAll でも使い回す）
  const allSurveyData = useMemo(() => (derived as any).getCurrentSurveyData("all"), [derived]);
  const overallPulse = allSurveyData.pulse;

  // 全社固定データ用インサイト
  const insAll = useMemo(() => {
    const pulse = allSurveyData.pulse;
    const prevPulse = allSurveyData.pulseHistory[11] || 0;
    const weather = getWeatherFromPulse(pulse);
    const trend = pulse > prevPulse ? "up" : pulse < prevPulse ? "down" : "flat";

    return {
      title: "全社",
      tone: "戦略的分析",
      text: aiContent?.summary || (allSurveyData.pulse > 0 ? allSurveyData.aiComment : "組織方針に基づき、各部署の体温スコアとKPI達成状況を俯瞰的に分析します。現在、実データの蓄積を開始した段階です。"),
      weather,
      trend
    };
  }, [allSurveyData, aiContent]);

  // 主要KPI
  const primaryKpi = derived.displayKpis[0];
  const primaryKpiAch = useMemo(() => {
    if (!primaryKpi || !primaryKpi.target) return null;
    const v = Number(primaryKpi.val);
    const t = Number(primaryKpi.target);
    if (isNaN(v) || isNaN(t) || t <= 0) return 0;
    return Math.round((v / t) * 100);
  }, [primaryKpi]);

  // 異常検知バナーの表示判定
  const anomalyAlert = useMemo(() => {
    if (!aiContent?.risk_level || aiContent.risk_level === 'low') return null;
    return {
      level: aiContent.risk_level as 'medium' | 'high',
      reason: aiContent.risk_reason || null,
    };
  }, [aiContent]);

  const selectedKpiDef = derived.displayKpis.find((k: any) => k.id === selKpi) || derived.displayKpis[0];
  const achRate = useMemo(() => {
    if (!selectedKpiDef || !selectedKpiDef.target) return null;
    const v = Number(selectedKpiDef.val);
    const t = Number(selectedKpiDef.target);
    if (isNaN(v) || isNaN(t) || t <= 0) return 0;
    return Math.round((v / t) * 100);
  }, [selectedKpiDef]);

  // サイズKPI名：第2軸が定義されていれば第2軸優先、無ければ達成率
  const sizeKpiName = useMemo(() => {
    const kpiDef = state.realKpis.find(k => k.id === company?.secondary_axis_size_kpi_id);
    return kpiDef ? kpiDef.name : "KPI達成率";
  }, [company, state.realKpis]);



  if (authLoading) return <Loading fullScreen message="データを準備しています..." />;
  if (!company) return null;

  return (
    <AppLayout
      currentSection={sec}
      onSectionChange={setSec}
      hasLaborData={state.hasLaborData}
      fullWidth={sec === "home"}
    >
      <TrialGuard>
        <div className="space-y-10">
          {sec === "home" && (
            <div className="animate-fadeIn">
              <HomeOverview
                company={company}
                userRole={userRole}
                userDepartmentId={userDepartmentId}
                displayDepts={derived.displayDepts}
                realKpis={state.realKpis}
                realKpiRecords={state.realKpiRecords}
                overallPulse={overallPulse}
                overallTrend={insAll.trend as any}
                overallComment={insAll.text}
                primaryKpi={primaryKpi}
                primaryKpiAch={primaryKpiAch}
                riskLevel={aiContent?.risk_level || "low"}
                responseRate={allSurveyData.responseRate}
                responseCount={allSurveyData.responseCount}
                recentInsights={state.realAiInsights}
                actions={state.realActionItems}
                onSectionChange={setSec}
              />
            </div>
          )}

          {sec === "report" && (
            <div className="space-y-10 animate-fadeIn">
              {/* A. AI組織診断レポート（全社） */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Target className="w-4 h-4 text-teal/60" />
                    AI組織診断レポート（全社）
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Company-wide AI Organization Diagnosis
                  </p>
                </div>

                {/* ① 注意バナー */}
                {anomalyAlert && (
                  <div className={cn(
                    "rounded-2xl px-6 py-4 flex items-start gap-4 border animate-fadeIn",
                    anomalyAlert.level === 'high'
                      ? "bg-rose-50 border-rose-200"
                      : "bg-amber-50 border-amber-200"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                      anomalyAlert.level === 'high' ? "bg-rose-100" : "bg-amber-100"
                    )}>
                      <AlertTriangle className={cn(
                        "w-4 h-4",
                        anomalyAlert.level === 'high' ? "text-rose-500" : "text-amber-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest mb-1",
                        anomalyAlert.level === 'high' ? "text-rose-500" : "text-amber-500"
                      )}>
                        {anomalyAlert.level === 'high' ? '⚠️ 組織異常を検知' : '注意 — 要観察'}
                      </p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {anomalyAlert.reason || 'AI分析により、組織状態に注意が必要な兆候が検出されました。'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ④ キー指標サマリー */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  {/* 全体体温 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Thermometer className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">全体体温</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-black text-slate-700">{overallPulse > 0 ? overallPulse.toFixed(1) : "—"}</span>
                        <span className="text-[10px] font-bold text-slate-400">/ 5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* 主要KPI達成率 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        主要KPI達成率{primaryKpi ? ` (${primaryKpi.name})` : ""}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-black text-slate-700">
                          {primaryKpiAch !== null ? `${primaryKpiAch}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* リスクレベル */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">組織リスクレベル</p>
                      <div className="mt-1 flex items-center">
                        {(() => {
                          const rLevel = aiContent?.risk_level || "low";
                          let label = "低（安全）";
                          let badgeClass = "border border-slate-100 text-slate-500 bg-slate-50/50";
                          let dotClass = "bg-slate-400";
                          if (rLevel === "high") {
                            label = "高（要警戒）";
                            badgeClass = "border border-rose-200 text-rose-600 bg-rose-50/30";
                            dotClass = "bg-rose-500";
                          } else if (rLevel === "medium") {
                            label = "中（要観察）";
                            badgeClass = "border border-amber-200 text-amber-600 bg-amber-50/30";
                            dotClass = "bg-amber-500";
                          }
                          return (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold", badgeClass)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ②-1. 全社固定 MainInsightCard */}
                <MainInsightCard
                  title={insAll.title}
                  tone={insAll.tone}
                  text={insAll.text}
                  weather={insAll.weather as any}
                  trend={insAll.trend as any}
                  onOpenDeepReport={undefined}
                />

                {/* ②-2. 全社固定 ReportSection */}
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
              </div>
            </div>
          )}

          <div className="animate-fadeIn">
          {sec === "matrix" && (
            <MatrixSection
              secondaryAxisName={secondaryAxisName}
              sizeKpiName={sizeKpiName}
              deptData={derived.displayDepts}
              axisData={derived.displayAxes}
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
                axisFinanceData={state.axisFinanceData}
                avgLaborCostPerHead={state.avgLaborCostPerHead}
                secondaryAxisName={secondaryAxisName}
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
              displayDepts={derived.displayDepts}
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
              customQuestions={state.realCustomQuestions}
              displayDepts={derived.displayDepts}
            />
          )}

          {sec === "action" && (
            <ActionSection actions={state.realActionItems} depts={state.realDepts} companyId={company?.id} onActionUpdated={handlers.updateActionItem} />
          )}

          {sec === "semantic" && (
            <SemanticSection
              displaySem={state.realSem || DEFAULT_SEMANTIC_POLICY}
              realSemHistory={state.realSemHistory}
              realDepts={state.realDepts}
              actions={state.realActionItems}
              onSave={handlers.handleSaveSemantic}
              onDelete={handlers.handleDeleteSemantic}
              aiContent={aiContent}
            />
          )}
          </div>
        </div>
      </TrialGuard>
    </AppLayout>
  );
}
