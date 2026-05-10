"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/hooks/useCompany";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { PlanGate } from "@/components/ui/PlanGate";
import { calcRiskAlerts } from "@/lib/logic/turnover-risk";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/constants";
import { AlertTriangle, TrendingUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { getLastNMonths, normalizeMonth } from "@/lib/utils/date";

/** Pearson 相関係数（ローカル定義） */
function pearson(xs: number[], ys: number[]): number {
  const pairs = Array.from({ length: Math.min(xs.length, ys.length) }, (_, i) => [xs[i], ys[i]])
    .filter(([x, y]) => x > 0 && y > 0);
  if (pairs.length < 3) return 0;
  const vx = pairs.map(([x]) => x);
  const vy = pairs.map(([, y]) => y);
  const mx = vx.reduce((s, v) => s + v, 0) / vx.length;
  const my = vy.reduce((s, v) => s + v, 0) / vy.length;
  const num = vx.reduce((s, v, i) => s + (v - mx) * (vy[i] - my), 0);
  const den = Math.sqrt(
    vx.reduce((s, v) => s + (v - mx) ** 2, 0) *
    vy.reduce((s, v) => s + (v - my) ** 2, 0)
  );
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

const last13Months = getLastNMonths(13);

const CARD_STYLE = {
  critical: { bg: "bg-rose-50",    border: "border-rose-200",   dot: "bg-rose-500" },
  warning:  { bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400" },
  info:     { bg: "bg-sky-50",     border: "border-sky-100",    dot: "bg-sky-400"  },
  none:     { bg: "bg-emerald-50", border: "border-emerald-100",dot: "bg-emerald-400" },
};

const TAG_STYLE = {
  critical: "bg-rose-100 text-rose-700",
  warning:  "bg-amber-100 text-amber-700",
  info:     "bg-sky-100 text-sky-600",
};

export default function HrStrategyPage() {
  const { company, supabase, isImpersonating, userRole, userDepartmentId } = useCompany();
  const { state, derived } = useDashboardData(company, supabase, isImpersonating, userRole, userDepartmentId);
  const displayDepts = derived.displayDepts;
  const companyPulseData = (derived as any).getCurrentSurveyData?.("all");
  const hasLaborData = displayDepts.some((d: any) => d.totalLaborCost > 0);

  const hrStrategyContent = (state as any).hrStrategyContent as string | undefined;
  const hrStrategyMonth   = (state as any).hrStrategyMonth   as string | undefined;

  const { canUse } = usePlanFeatures();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  if (!canUse("hr_strategy")) {
    return (
      <AppLayout hasLaborData={hasLaborData}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <PlanGate feature="hr_strategy" requiredPlan="Pro">
            <div className="h-40" />
          </PlanGate>
        </div>
      </AppLayout>
    );
  }

  // 全社平均 1人あたり人件費
  const avgLaborCostPerHead = (() => {
    const vals = displayDepts.filter(d => d.laborCostPerHead > 0).map(d => d.laborCostPerHead);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  })();

  // リスクアラート（部署別・深刻度順）
  const riskData = displayDepts
    .filter(d => d.pulseHistory.some(p => p > 0))
    .map(d => {
      const responseRate = d.masterHeadcount > 0
        ? Math.round((d.respondentsCount / d.masterHeadcount) * 100)
        : 0;
      return {
        ...d,
        risk: calcRiskAlerts(
          d.pulseHistory,
          d.kpiAch,
          d.laborCostPerHead,
          avgLaborCostPerHead,
          responseRate,
        ),
      };
    })
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, warning: 1, info: 2, none: 3 };
      return order[a.risk.topSeverity] - order[b.risk.topSeverity];
    });

  // エンゲージメントドライバー（部署別設問スコア × 部署KPI達成率の相関）
  // パネルデータ（部署 × 月）で xs/ys ペアを構築するヘルパー
  const realResponses = (state as any).realResponses as any[];

  const buildPairs = (
    getQScore: (dept: any, monthIdx: number) => number
  ): { xs: number[]; ys: number[]; n: number } => {
    const xs: number[] = [];
    const ys: number[] = [];
    displayDepts.forEach((dept: any) => {
      const kpiHistory: number[] = dept.kpiAchHistory ?? [];
      for (let mi = 0; mi < last13Months.length; mi++) {
        const qScore = getQScore(dept, mi);
        const kpiAch = kpiHistory[mi] ?? 0;
        if (qScore > 0 && kpiAch > 0) {
          xs.push(qScore);
          ys.push(kpiAch);
        }
      }
    });
    return { xs, ys, n: xs.length };
  };

  // 標準設問
  const standardDriverData = DEFAULT_SURVEY_QUESTIONS.map((q, qi) => {
    const { xs, ys, n } = buildPairs((dept, mi) => {
      const monthStr = last13Months[mi];
      const responses = realResponses.filter((r: any) =>
        r.department_id === dept.id &&
        normalizeMonth(r.recorded_month) === monthStr
      );
      const scores: number[] = [];
      responses.forEach((r: any) => {
        const ans = r.survey_answers || [];
        if (ans[qi]?.score) scores.push(ans[qi].score);
      });
      if (scores.length === 0) return 0;
      return scores.reduce((s: number, v: number) => s + v, 0) / scores.length;
    });
    return {
      text: q.text,
      corr: pearson(xs, ys),
      avgScore: companyPulseData?.scores?.[qi] ?? 0,
      isCustom: false as const,
      n,
      qi,
    };
  });

  // カスタム設問
  const customQuestions = (state as any).realCustomQuestions as any[] ?? [];
  const customDriverData = customQuestions.map((q: any, ci: number) => {
    const { xs, ys, n } = buildPairs((dept, mi) => {
      const monthStr = last13Months[mi];
      const responses = realResponses.filter((r: any) =>
        r.department_id === dept.id &&
        normalizeMonth(r.recorded_month) === monthStr
      );
      const scores: number[] = [];
      responses.forEach((r: any) => {
        const ans = r.survey_answers || [];
        const match = ans.find((a: any) => String(a.question_id) === String(q.id));
        if (match?.score) scores.push(match.score);
      });
      if (scores.length === 0) return 0;
      return scores.reduce((s: number, v: number) => s + v, 0) / scores.length;
    });
    return {
      text: q.text,
      corr: pearson(xs, ys),
      avgScore: (companyPulseData as any)?.customScores?.[ci] ?? 0,
      isCustom: true as const,
      n,
      questionId: q.id,
    };
  });

  // 一括ソート
  const driverData = [...standardDriverData, ...customDriverData]
    .sort((a, b) => b.corr - a.corr);

  // 部署別ドライバー推移 用
  const activeDeptId = selectedDeptId || displayDepts[0]?.id || "";

  // 全社ドライバー上位3件（ソート済みの先頭）
  const top3Drivers = driverData.slice(0, 3);

  // 選択部署の月別スコア（上位3設問分）
  const top3MonthlyScores: number[][] = top3Drivers.map(driver => {
    return last13Months.map(monthStr => {
      const responses = realResponses.filter((r: any) =>
        r.department_id === activeDeptId &&
        normalizeMonth(r.recorded_month) === monthStr
      );
      if (responses.length === 0) return 0;
      const scores: number[] = [];
      if (!driver.isCustom && driver.qi !== undefined) {
        responses.forEach((r: any) => {
          const ans = r.survey_answers || [];
          if (ans[driver.qi!]?.score) scores.push(ans[driver.qi!].score);
        });
      } else if (driver.isCustom && (driver as any).questionId) {
        responses.forEach((r: any) => {
          const ans = r.survey_answers || [];
          const match = ans.find((a: any) => String(a.question_id) === String((driver as any).questionId));
          if (match?.score) scores.push(match.score);
        });
      }
      return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    });
  });

  // 選択部署の KPI 月別達成率
  const activeDept = displayDepts.find((d: any) => d.id === activeDeptId);
  const activeDeptKpiHistory: number[] = (activeDept as any)?.kpiAchHistory ?? new Array(13).fill(0);

  // データ点数（全設問共通、標準設問の最大値を代表値として使用）
  const panelN = standardDriverData[0]?.n ?? 0;

  const hasData = displayDepts.length > 0;

  return (
    <AppLayout hasLaborData={hasLaborData}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

          {/* ヘッダー */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md tracking-widest uppercase">PRO</span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">人事戦略インサイト</h1>
            </div>
            <p className="text-slate-400 text-sm font-medium">組織コンディションの早期検知・エンゲージメント改善・AI人事戦略提言</p>
          </div>

          {/* Section ①: リスクアラート */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
              <h2 className="text-base font-black text-slate-700">リスクアラート</h2>
            </div>

            {!hasData || riskData.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm font-medium">
                アンケートデータが蓄積されると分析が表示されます
              </div>
            ) : (
              <div className="space-y-3">
                {riskData.map(d => {
                  const c = CARD_STYLE[d.risk.topSeverity as keyof typeof CARD_STYLE];
                  return (
                    <div key={d.id} className={cn("rounded-2xl border p-5 flex items-start gap-4", c.bg, c.border)}>
                      <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", c.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-slate-800 text-sm">{d.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {d.risk.alerts.length > 0
                            ? d.risk.alerts.map(a => (
                                <span
                                  key={a.label}
                                  className={cn(
                                    "text-[11px] px-2.5 py-0.5 rounded-full font-medium",
                                    TAG_STYLE[a.severity as keyof typeof TAG_STYLE]
                                  )}
                                >
                                  {a.label}
                                </span>
                              ))
                            : <span className="text-[11px] text-slate-400">特記事項なし</span>
                          }
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400 flex-shrink-0 space-y-0.5">
                        <div>体温 <span className="font-black text-slate-600">{d.pulse}</span></div>
                        <div>KPI <span className="font-black text-slate-600">{d.kpiAch}%</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section ②: エンゲージメントドライバー分析 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4.5 h-4.5 text-teal-500" />
              <h2 className="text-base font-black text-slate-700">エンゲージメントドライバー分析</h2>
            </div>

            {/* 凡例 */}
            <div className="mb-3 space-y-2">
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                スコアを上げるとKPI達成率が改善しやすい設問を上位に表示しています。
                <span className="relative group inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help flex-shrink-0">
                  ?
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg shadow-lg invisible group-hover:visible z-50 leading-relaxed font-medium whitespace-normal pointer-events-none space-y-2">
                    <span className="block font-black text-slate-700">相関係数とは？</span>
                    <span className="block">各設問のスコアと部署KPI達成率の関連の強さを −1〜＋1 で表した値です。</span>
                    <span className="block space-y-1">
                      <span className="flex gap-2"><span className="text-teal-600 font-black">＋1 に近い</span><span>スコアが高い部署ほどKPIも高い（強化推奨）</span></span>
                      <span className="flex gap-2"><span className="font-black text-slate-400"> 0 に近い</span><span>スコアとKPIに直線的な関係がない</span></span>
                      <span className="flex gap-2"><span className="text-rose-500 font-black">－1 に近い</span><span>スコアが高いのにKPIが低い（構造的課題の可能性）</span></span>
                    </span>
                    <span className="block text-slate-400">過去13ヶ月 × 全部署のデータを使用。蓄積されるほど精度が上がります。</span>
                  </span>
                </span>
                {panelN > 0 && (
                  <span className="ml-auto text-[10px] text-slate-400 font-medium shrink-0">
                    n={panelN} データ点
                  </span>
                )}
              </p>
              {/* バー軸ラベル */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-rose-400 w-4 text-right shrink-0">−1</span>
                <div className="flex-1 flex justify-between text-[9px] font-bold text-slate-300 px-1">
                  <span>負の相関</span>
                  <span>0</span>
                  <span>正の相関</span>
                </div>
                <span className="text-[10px] font-black text-teal-500 w-12 text-right shrink-0">＋1</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {driverData.every(d => d.avgScore === 0) ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  アンケートデータが蓄積されると表示されます
                </div>
              ) : (
                driverData.map((d, idx) => {
                  const isPositive = d.corr >= 0;
                  const barWidth = Math.round(Math.abs(d.corr) * 100);
                  return (
                    <div key={idx} className={cn("flex items-center gap-4 px-5 py-3.5", idx !== 0 && "border-t border-slate-50")}>
                      <span className="text-[11px] font-black text-slate-400 w-4">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-700 truncate">{d.text}</p>
                          {d.isCustom && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-400 shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 relative h-1.5">
                            {/* 背景 */}
                            <div className="absolute inset-0 bg-slate-100 rounded-full" />
                            {/* 中央の基準線 */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10" />
                            {/* バー本体 */}
                            {isPositive ? (
                              <div
                                className="absolute top-0 bottom-0 bg-teal-400 rounded-r-full z-20"
                                style={{ left: '50%', width: `${barWidth / 2}%` }}
                              />
                            ) : (
                              <div
                                className="absolute top-0 bottom-0 bg-rose-400 rounded-l-full z-20"
                                style={{ right: '50%', width: `${barWidth / 2}%` }}
                              />
                            )}
                          </div>
                          <span className={cn("text-[11px] font-black w-12 text-right", isPositive ? "text-teal-600" : "text-rose-500")}>
                            {d.corr > 0 ? "+" : ""}{d.corr.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 w-12 text-right flex-shrink-0">
                        avg <span className="font-black text-slate-600">{d.avgScore > 0 ? d.avgScore.toFixed(1) : "-"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-medium px-1">
              ※ 部署数が少ない場合、相関係数は参考値として扱ってください
            </p>
          </section>

          {/* Section ③: 部署別ドライバー推移 */}
          {hasData && top3Drivers.length > 0 && displayDepts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-base font-black text-slate-700">部署別ドライバー推移</h2>
              </div>

              {/* 部署タブ */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {displayDepts.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeptId(d.id)}
                    className={cn(
                      "text-xs font-black px-3 py-1.5 rounded-full border transition-colors",
                      activeDeptId === d.id
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                    )}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                {/* 凡例 */}
                <div className="flex flex-wrap gap-4">
                  {top3Drivers.map((d, i) => {
                    const colors = ["#14b8a6", "#8b5cf6", "#f59e0b"];
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                        <span className="text-[10px] font-bold text-slate-500 max-w-[120px] truncate">{d.text}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-6 h-0 border-t-2 border-dashed border-indigo-400 opacity-60" />
                    <span className="text-[10px] font-bold text-slate-500">KPI達成率</span>
                  </div>
                </div>

                {/* SVGチャート */}
                {(() => {
                  const COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b"];
                  const W = 600, H = 200;
                  const pad = { top: 16, right: 40, bottom: 32, left: 32 };
                  const cW = W - pad.left - pad.right;
                  const cH = H - pad.top - pad.bottom;
                  const months = last13Months.length;

                  const xPos = (i: number) => pad.left + (months > 1 ? (i / (months - 1)) * cW : cW / 2);

                  // スコアを 0-100% に正規化して KPI と同スケールで描画
                  const normalizeScore = (s: number) => (s / 5) * 100;

                  // 全値の最大（KPI が 100 超えることもある）
                  const allVals = [
                    ...top3MonthlyScores.flat().map(normalizeScore),
                    ...activeDeptKpiHistory
                  ].filter(v => v > 0);
                  const maxVal = Math.max(...allVals, 100);

                  const yPos = (v: number) => pad.top + cH - (v / maxVal) * cH;

                  const toPath = (vals: number[]) =>
                    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(v)}`).join(" ");

                  // 表示する月ラベル（3ヶ月おき）
                  const labels = last13Months.map(m => m.slice(5, 7) + "月");

                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
                      {/* グリッド */}
                      {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                          <line
                            x1={pad.left} y1={yPos(v)} x2={pad.left + cW} y2={yPos(v)}
                            stroke="#F1F5F9" strokeWidth={1}
                          />
                          <text x={pad.left - 4} y={yPos(v) + 3} textAnchor="end"
                            className="text-[9px] fill-slate-300 font-bold">{v}</text>
                        </g>
                      ))}

                      {/* KPI 達成率（塗り面積） */}
                      <path
                        d={`${toPath(activeDeptKpiHistory)} L ${xPos(months - 1)} ${pad.top + cH} L ${xPos(0)} ${pad.top + cH} Z`}
                        fill="#818cf8" fillOpacity={0.08}
                      />
                      <path
                        d={toPath(activeDeptKpiHistory)}
                        fill="none" stroke="#818cf8" strokeWidth={2.5} strokeLinecap="round"
                        strokeDasharray="6 3"
                      />

                      {/* 設問スコア3本 */}
                      {top3MonthlyScores.map((scores, li) => (
                        <path
                          key={li}
                          d={toPath(scores.map(normalizeScore))}
                          fill="none"
                          stroke={COLORS[li]}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}

                      {/* X軸ラベル */}
                      {labels.map((label, i) => {
                        if (i % 3 !== 0 && i !== months - 1) return null;
                        return (
                          <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle"
                            className="text-[9px] fill-slate-400 font-bold">{label}</text>
                        );
                      })}
                    </svg>
                  );
                })()}

                <p className="text-[10px] text-slate-400 font-medium">
                  ※ 設問スコアは 5点満点を 100% に換算して表示。KPI達成率と同スケールで比較できます。
                </p>
              </div>
            </section>
          )}

          {/* Section ④: AI 人事戦略提言 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4.5 h-4.5 text-violet-500" />
                <h2 className="text-base font-black text-slate-700">AI 人事戦略提言</h2>
              </div>
              {hrStrategyMonth && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {hrStrategyMonth.slice(0, 7)} 時点の分析
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              {hrStrategyContent ? (
                <div className="whitespace-pre-wrap text-sm text-slate-700 font-medium leading-relaxed">
                  {hrStrategyContent}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Brain className="w-8 h-8 text-slate-200" />
                  <p className="text-slate-500 text-sm font-medium">AI分析がまだ実行されていません</p>
                  <p className="text-slate-400 text-xs font-medium">
                    設定 → AI分析タブ から「最新の分析を生成する」を実行すると<br />ここに人事戦略提言が表示されます
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
