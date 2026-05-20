/**
 * 匿名性ガード
 * 個人特定リスクを下げるため、サンプル数が一定数未満の集計は非表示にする。
 * 経営層/Admin以外（マネージャー・プレイヤー）向け画面で使用想定。
 */

/** デフォルト閾値（3名未満は非表示） */
export const ANONYMITY_THRESHOLD = 3;

/** 非表示時のプレースホルダー表示 */
export const ANONYMITY_HIDDEN_LABEL = "—";

/** 非表示理由（tooltip/aria-label 等で利用） */
export const ANONYMITY_HIDDEN_REASON = "回答者が少ないため非表示（個人特定防止）";

/**
 * サンプル数が閾値以上か判定
 * @param count サンプル数
 * @param threshold 閾値（デフォルト 3）
 */
export function passesAnonymityGuard(count: number, threshold = ANONYMITY_THRESHOLD): boolean {
    return count >= threshold;
}

/**
 * 集計値を匿名性ガードでラップ。ガードに引っかかった場合は null を返す。
 * @example
 *   const avg = safeAggregateValue(4.2, sampleCount); // sampleCount<3 なら null
 */
export function safeAggregateValue<T>(
    value: T,
    count: number,
    threshold = ANONYMITY_THRESHOLD
): T | null {
    return passesAnonymityGuard(count, threshold) ? value : null;
}

/**
 * グループ化された集計配列から、サンプル数が閾値未満のグループを除外
 * @param groups 集計結果の配列
 * @param getCount 各グループのサンプル数取得関数
 * @example
 *   filterByAnonymity(deptSummaries, d => d.responseCount)
 */
export function filterByAnonymity<T>(
    groups: T[],
    getCount: (item: T) => number,
    threshold = ANONYMITY_THRESHOLD
): T[] {
    return groups.filter(item => passesAnonymityGuard(getCount(item), threshold));
}
