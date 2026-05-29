/**
 * モデル別トークン価格定義およびコスト計算用ユーティリティ
 */

export const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-7-sonnet-20250219': { input: 3.0,  output: 15.0 },  // 1MトークンあたりのUSD価格
  'claude-3-5-haiku-20241022':  { input: 0.8,  output: 4.0  },
};

// デフォルトのドル円為替レート（150円）
export const DEFAULT_USD_TO_JPY = 150;

/**
 * 入出力トークン数およびモデルからAI利用コスト（USD）を算出する
 * 
 * @param model - 使用モデル名
 * @param input - インプットトークン数
 * @param output - アウトプットトークン数
 * @returns 計算されたコスト（USD、小数）
 */
export function calcCostUsd(model: string, input: number, output: number): number {
  const p = TOKEN_PRICING[model] ?? TOKEN_PRICING['claude-3-7-sonnet-20250219'];
  return (input * p.input + output * p.output) / 1_000_000;
}
