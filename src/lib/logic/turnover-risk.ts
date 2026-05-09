/**
 * リスクアラート算出ロジック
 * 離職リスクに限らず、組織の異常を検知してアラートタグとして返す。
 */

export type AlertSeverity = "critical" | "warning" | "info";

export interface RiskAlert {
  label: string;
  severity: AlertSeverity;
}

export interface RiskAlertResult {
  alerts: RiskAlert[];
  /** 最も深刻な severity（カードの色決定に使う） */
  topSeverity: AlertSeverity | "none";
}

/**
 * 直近1ヶ月の体温変化量（前月比）を計算
 * 負値 = 低下
 */
function pulseMonthOverMonth(pulseHistory: number[]): number {
  const cur  = pulseHistory[pulseHistory.length - 1] || 0;
  const prev = pulseHistory[pulseHistory.length - 2] || 0;
  if (cur === 0 || prev === 0) return 0;
  return cur - prev;
}

/**
 * 直近3ヶ月の体温トレンド（傾き）。負値 = 低下傾向
 */
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
 * @param pulseHistory        13ヶ月の体温スコア配列（0=データなし）
 * @param kpiAch              直近月のKPI達成率（%）
 * @param laborCostPerHead    1人あたり人件費（万円）
 * @param avgLaborCostPerHead 全社平均1人あたり人件費（0なら比較しない）
 * @param responseRate        回答率（%、0なら比較しない）
 */
export function calcRiskAlerts(
  pulseHistory: number[],
  kpiAch: number,
  laborCostPerHead: number,
  avgLaborCostPerHead: number,
  responseRate: number,
): RiskAlertResult {
  const alerts: RiskAlert[] = [];

  const currentPulse = pulseHistory[pulseHistory.length - 1] || 0;
  const mom = pulseMonthOverMonth(pulseHistory);
  const trend = pulseTrend(pulseHistory);

  // ── 体温アラート ──────────────────────────────
  if (currentPulse > 0 && currentPulse < 2.5) {
    alerts.push({ label: "体温が危険域", severity: "critical" });
  } else if (currentPulse > 0 && currentPulse < 3.0) {
    alerts.push({ label: "体温が低迷", severity: "warning" });
  }

  if (mom <= -0.8) {
    alerts.push({ label: "体温が急落（前月比 -0.8以上）", severity: "critical" });
  } else if (mom <= -0.5) {
    alerts.push({ label: "体温が急落（前月比 -0.5以上）", severity: "warning" });
  } else if (mom <= -0.3) {
    alerts.push({ label: "体温が低下傾向", severity: "info" });
  }

  if (trend < -0.3 && mom > -0.5) {
    // 急落アラートと重複しない場合のみ
    alerts.push({ label: "体温が3ヶ月連続低下", severity: "warning" });
  }

  // ── KPI アラート ──────────────────────────────
  if (kpiAch > 0 && kpiAch < 60) {
    alerts.push({ label: "KPI未達が深刻", severity: "critical" });
  } else if (kpiAch > 0 && kpiAch < 80) {
    alerts.push({ label: "KPI達成率が低迷", severity: "warning" });
  }

  // ── 回答率アラート ────────────────────────────
  if (responseRate > 0 && responseRate < 50) {
    alerts.push({ label: "回答率が低下", severity: "warning" });
  } else if (responseRate > 0 && responseRate < 70) {
    alerts.push({ label: "回答率がやや低い", severity: "info" });
  }

  // ── 報酬水準アラート ──────────────────────────
  if (avgLaborCostPerHead > 0 && laborCostPerHead > 0) {
    const ratio = laborCostPerHead / avgLaborCostPerHead;
    if (ratio < 0.75) {
      alerts.push({ label: "報酬水準が平均を大幅下回る", severity: "warning" });
    } else if (ratio < 0.90) {
      alerts.push({ label: "報酬水準がやや低い", severity: "info" });
    }
  }

  // topSeverity を決定
  const topSeverity: RiskAlertResult["topSeverity"] =
    alerts.some(a => a.severity === "critical") ? "critical" :
    alerts.some(a => a.severity === "warning")  ? "warning"  :
    alerts.some(a => a.severity === "info")      ? "info"     :
    "none";

  return { alerts, topSeverity };
}
