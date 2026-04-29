/**
 * KPI達成率の計算（最大化/最小化目標に対応）
 */
export function calculateAchievementRate(actual: number, target: number, isHigherBetter: boolean = true): number | null {
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
 * 体温スコアから天気アイコンへの変換
 */
export function getWeatherFromPulse(score: number): "sun" | "cloud" | "rain" {
    if (score >= 3.8) return "sun";
    if (score >= 3.0) return "cloud";
    return "rain";
}

/**
 * 前月比（YoY/MoM）の計算
 */
export function calculateGrowthRate(current: number, previous: number): number | null {
    if (previous === 0 || isNaN(current) || isNaN(previous)) return null;
    return Math.round((current / previous) * 100);
}
