/**
 * KPI達成率の計算（最大化/最小化目標に対応）
 */
export function calculateAchievementRate(actual: number | null | undefined, target: number | null | undefined, isHigherBetter: boolean = true): number | null {
    // 実績・目標のいずれかが未入力(null)なら「達成率なし」として母数から外す。
    // kpi_records.value が NULL 許容になったため、ここでガードしないと
    // 上振れKPIは (null/target)=0%、下振れKPIは (target/null)=Infinity として
    // 誤って集計・グラフに混入する（全呼び出し元をここで一括保護する）。
    if (actual === null || actual === undefined || target === null || target === undefined) {
        return null;
    }
    if (target <= 0) {
        // 目標が0の場合は、平均計算の母数から外す（オリジナル挙動の再現）
        return null;
    }

    if (isHigherBetter) {
        // 高いほど良い (通常)
        return (actual / target) * 100;
    } else {
        // 低いほど良い (離職率など)
        if (actual === 0) return 100; // 0なら最高評価
        // 目標5%に対して実績2%なら 5/2 * 100 = 250%
        return (target / actual) * 100;
    }
}

/**
 * 生産性スコアの計算: KPI達成率 × 体温係数
 */
export function calculateProductivity(achievementRate: number, pulseScore: number): number {
    // 体温スコア (0-5) を係数に変換 (3.0 を基準 1.0 とした簡易モデル)
    const pulseFactor = pulseScore > 0 ? (pulseScore / 3.0) : 1.0;
    return Math.round(achievementRate * pulseFactor);
}

/**
 * 体温の「良好」「要注意」の閾値（全画面共通）。
 * 以前は画面ごとに 3.5/2.5、4.0/3.0、3.8/3.0 等バラバラで、同じ体温スコアが
 * 画面によって緑になったり黄になったりしていたため、ここに一元化する。
 */
export const PULSE_GOOD_THRESHOLD = 3.8;
export const PULSE_WATCH_THRESHOLD = 3.0;

/**
 * 体温スコアから天気アイコンへの変換
 */
export function getWeatherFromPulse(score: number): "sun" | "cloud" | "rain" {
    if (score >= PULSE_GOOD_THRESHOLD) return "sun";
    if (score >= PULSE_WATCH_THRESHOLD) return "cloud";
    return "rain";
}

/**
 * 前月比（YoY/MoM）の計算
 */
export function calculateGrowthRate(current: number, previous: number): number | null {
    if (previous === 0 || isNaN(current) || isNaN(previous)) return null;
    return Math.round((current / previous) * 100);
}

/** KPI達成の"質"を4象限で判定（コンディション診断） */
export type KpiQuality = "healthy" | "burnout" | "structural" | "potential";

export function calcKpiQuality(kpiAch: number, pulse: number): KpiQuality {
  const achieved = kpiAch >= 100;
  // 体温の「良好」判定は色分けと同じ PULSE_GOOD_THRESHOLD に揃える。
  // （同一カード内で「色は黄なのに診断は健全」という食い違いを防ぐ）
  const healthy  = pulse >= PULSE_GOOD_THRESHOLD;
  if ( achieved &&  healthy) return "healthy";
  if ( achieved && !healthy) return "burnout";
  if (!achieved && !healthy) return "structural";
  return "potential";
}

export const KPI_QUALITY_META: Record<KpiQuality, {
  label: string; icon: string; color: string; bg: string; description: string;
}> = {
  healthy:    { label: "健全", icon: "✅", color: "text-emerald-600", bg: "bg-emerald-50", description: "KPI達成かつ体温も良好。横展開できるベストプラクティスが存在する可能性。" },
  burnout:    { label: "焼き付き", icon: "⚠️", color: "text-amber-600",  bg: "bg-amber-50",  description: "KPIを達成しているが体温が低下。無理な稼働が継続している可能性。早期介入を推奨。" },
  structural: { label: "構造課題", icon: "🔴", color: "text-rose-600",   bg: "bg-rose-50",   description: "KPI未達かつ体温も低下。目標・リソース・戦略のいずれかに根本的な問題がある可能性。" },
  potential:  { label: "余力あり", icon: "💡", color: "text-sky-600",    bg: "bg-sky-50",    description: "体温は高いがKPI未達。目標設定のミスマッチか、能力を活かせていない可能性。" },
};

/** KPI設定の"健全性"を判定（過去13ヶ月の達成率分布から） */
export type KpiSetHealth = "sandbagging" | "overstretch" | "optimal";

export function calcKpiSetHealth(kpiAchHistory: number[]): KpiSetHealth {
  const valid = kpiAchHistory.filter(v => v > 0);
  if (valid.length < 3) return "optimal"; // データ不足は判定しない
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  if (avg > 115) return "sandbagging";
  if (avg < 65)  return "overstretch";
  return "optimal";
}

export const KPI_SET_HEALTH_META: Record<KpiSetHealth, {
  label: string; color: string; description: string;
}> = {
  sandbagging: { label: "目標が低すぎる可能性", color: "text-violet-600", description: "達成率が常に高水準。目標値がチャレンジングでない可能性があります。" },
  overstretch: { label: "目標が高すぎる可能性", color: "text-rose-500",   description: "達成率が慢性的に低水準。体温への影響も確認してください。" },
  optimal:     { label: "設定適正",             color: "text-slate-400",  description: "達成率が適切な幅で推移しています。" },
};
