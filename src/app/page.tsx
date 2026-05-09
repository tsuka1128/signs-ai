"use client";

import { useState, useMemo, useEffect } from "react";
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
import { cn } from "@/lib/utils/index";
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
    const deptIdx = state.realDepts.findIndex(d => d.id === tab);

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
      let pulseAtMonth = d.pulseHistory?.[targetIdx] || 0;
      const headAtMonth = d.headHistory?.[targetIdx] || 0;
      let prodAtMonth = d.productivityHistory?.[targetIdx] || 100;
      const sizeAtMonth = (matView === "product" && d.sizeHistory) ? d.sizeHistory[targetIdx] : 100;

      // 回答なし（pulse === 0）の場合、前月（または直近の過去月）の生産性を位置のフォールバックとして使用する
      if (pulseAtMonth === 0 && d.pulseHistory && d.productivityHistory) {
        for (let i = targetIdx - 1; i >= 0; i--) {
          if (d.pulseHistory[i] > 0) {
            prodAtMonth = d.productivityHistory[i];
            break;
          }
        }
      }

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
        pulse: pulseAtMonth,
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
          {/* 異常検知バナー */}
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
                  {anomalyAlert.reason || 'AI分析により、組織状態に注意が必要な兆候が検出されました。詳細はレポートセクションを確認してください。'}
                </p>
              </div>
              <button
                onClick={() => setSec('report')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex-shrink-0 transition-all",
                  anomalyAlert.level === 'high'
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                )}
              >
                詳細を見る →
              </button>
            </div>
          )}
          {sec === "report" && (
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
                  {(() => {
                    const deptInsight = aiContent?.insights_by_dept?.[dept.id];
                    if (deptInsight?.text) {
                      return (
                        <div className="space-y-2">
                          {deptInsight.tone && (
                            <span className="inline-block text-[9px] text-teal-600 font-black px-2 py-0.5 bg-teal-50 rounded-full border border-teal-100">
                              {deptInsight.tone}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{deptInsight.text}</p>
                        </div>
                      );
                    }
                    return (
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                        AI分析を実行すると、「{dept.name}」の体温と全社方針を掛け合わせた専用メッセージが表示されます。
                      </p>
                    );
                  })()}
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
