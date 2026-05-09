/**
 * 離職リスクスコア算出ロジック
 * 入力はすべて useDashboardData の displayDepts から取得可能。新規DBクエリ不要。
 */

export type RiskLevel = "high" | "medium" | "low";

export interface TurnoverRiskResult {
  score: number;    // 0–100（高いほど離職リスク大）
  level: RiskLevel;
  factors: string[];
}

/** 直近3ヶ月の体温トレンド（傾き）を計算。負値 = 低下傾向 */
function pulseTrend(pulseHistory: number[]): number {
  const recent = pulseHistory.slice(-3).filter(v => v > 0);
  if (recent.length < 2) return 0;
  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, v) => s + v, 0) / n;
  const num = recent.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
  const den = recent.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

/**
 * @param pulseHistory       13ヶ月の体温スコア配列（0=データなし）
 * @param kpiAch             直近月のKPI達成率（%）
 * @param laborCostPerHead   1人あたり人件費（万円）
 * @param avgLaborCostPerHead 全社平均1人あたり人件費（0なら比較しない）
 */
export function calcTurnoverRisk(
  pulseHistory: number[],
  kpiAch: number,
  laborCostPerHead: number,
  avgLaborCostPerHead: number
): TurnoverRiskResult {
  let score = 0;
  const factors: string[] = [];

  // ① 現在体温（最大40点）
  const currentPulse = pulseHistory[pulseHistory.length - 1] || 0;
  if (currentPulse > 0) {
    if (currentPulse < 2.5)      { score += 40; factors.push("体温が危険域"); }
    else if (currentPulse < 3.0) { score += 28; factors.push("体温が低迷"); }
    else if (currentPulse < 3.5) { score += 14; }
  }

  // ② 体温トレンド（最大25点）
  const trend = pulseTrend(pulseHistory);
  if (trend < -0.3)      { score += 25; factors.push("体温が3ヶ月連続低下"); }
  else if (trend < -0.1) { score += 12; factors.push("体温が低下傾向"); }

  // ③ KPI達成率（最大20点）
  if (kpiAch > 0) {
    if (kpiAch < 60)      { score += 20; factors.push("KPI未達が深刻"); }
    else if (kpiAch < 80) { score += 10; factors.push("KPI達成率が低迷"); }
  }

  // ④ 1人あたり人件費が全社平均を大幅下回る（最大15点）
  if (avgLaborCostPerHead > 0 && laborCostPerHead > 0) {
    const ratio = laborCostPerHead / avgLaborCostPerHead;
    if (ratio < 0.75)      { score += 15; factors.push("報酬水準が平均を大幅下回る"); }
    else if (ratio < 0.90) { score += 7;  factors.push("報酬水準がやや低い"); }
  }

  score = Math.min(100, score);
  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, factors };
}
