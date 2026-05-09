"use client";

import { useCompany } from "@/hooks/useCompany";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { PlanGate } from "@/components/ui/PlanGate";
import { calcTurnoverRisk } from "@/lib/logic/turnover-risk";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/constants";
import { AlertTriangle, TrendingUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils/index";

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

const RISK_STYLE = {
  high:   { bg: "bg-rose-50",    border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",    dot: "bg-rose-500",   label: "高リスク" },
  medium: { bg: "bg-amber-50",   border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400",  label: "中リスク" },
  low:    { bg: "bg-emerald-50", border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-400",label: "低リスク" },
};

export default function HrStrategyPage() {
  const { company, supabase, isImpersonating, userRole, userDepartmentId } = useCompany();
  const { state, derived } = useDashboardData(company, supabase, isImpersonating, userRole, userDepartmentId);
  const displayDepts = derived.displayDepts;
  const companyPulseData = (derived as any).getCurrentSurveyData?.("all");

  const hrStrategyContent = (state as any).hrStrategyContent as string | undefined;
  const hrStrategyMonth   = (state as any).hrStrategyMonth   as string | undefined;

  const { canUse } = usePlanFeatures();

  if (!canUse("hr_strategy")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <PlanGate feature="hr_strategy" requiredPlan="Pro">
          <div className="h-40" />
        </PlanGate>
      </div>
    );
  }

  // 全社平均 1人あたり人件費
  const avgLaborCostPerHead = (() => {
    const vals = displayDepts.filter(d => d.laborCostPerHead > 0).map(d => d.laborCostPerHead);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  })();

  // 離職リスクスコア（部署別・リスク降順）
  const riskData = displayDepts
    .filter(d => d.pulseHistory.some(p => p > 0))
    .map(d => ({ ...d, risk: calcTurnoverRisk(d.pulseHistory, d.kpiAch, d.laborCostPerHead, avgLaborCostPerHead) }))
    .sort((a, b) => b.risk.score - a.risk.score);

  // エンゲージメントドライバー（全社設問スコア × 部署KPI達成率の相関）
  const kpiAchs = displayDepts.map(d => d.kpiAch);
  const driverData = DEFAULT_SURVEY_QUESTIONS
    .map((q, qi) => {
      const qScores = displayDepts.map(() => companyPulseData?.scores?.[qi] ?? 0);
      return {
        text: q.text,
        corr: pearson(qScores, kpiAchs),
        avgScore: companyPulseData?.scores?.[qi] ?? 0,
      };
    })
    .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

  const hasData = displayDepts.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ヘッダー */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md tracking-widest uppercase">PRO</span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">人事戦略インサイト</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">離職リスクの早期検知・エンゲージメント改善・AI人事戦略提言</p>
        </div>

        {/* Section ①: 離職リスクアラート */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
            <h2 className="text-base font-black text-slate-700">離職リスクアラート</h2>
          </div>

          {!hasData || riskData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm font-medium">
              アンケートデータが蓄積されると分析が表示されます
            </div>
          ) : (
            <div className="space-y-3">
              {riskData.map(d => {
                const s = RISK_STYLE[d.risk.level as keyof typeof RISK_STYLE] || RISK_STYLE.low;
                return (
                  <div key={d.id} className={cn("rounded-2xl border p-5 flex items-start gap-4", s.bg, s.border)}>
                    <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", s.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-slate-800 text-sm">{d.name}</span>
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg", s.badge)}>
                          {s.label} {d.risk.score}点
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.risk.factors.length > 0
                          ? d.risk.factors.map(f => (
                              <span key={f} className="text-[11px] bg-white/70 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                                {f}
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4.5 h-4.5 text-teal-500" />
            <h2 className="text-base font-black text-slate-700">エンゲージメントドライバー分析</h2>
            <span className="text-[11px] text-slate-400 font-medium ml-1">設問スコアとKPI達成率の相関</span>
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
                      <p className="text-xs font-bold text-slate-700 truncate">{d.text}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", isPositive ? "bg-teal-400" : "bg-rose-400")}
                            style={{ width: `${barWidth}%` }}
                          />
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

        {/* Section ③: AI 人事戦略提言 */}
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
  );
}
