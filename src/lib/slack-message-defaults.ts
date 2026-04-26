export const SLACK_MESSAGE_DEFAULTS = {
  ai_summary: "📊 *AI分析が完了しました*\n今月のSigns AIによる分析レポートが生成されました。ダッシュボードでご確認ください。",
  anomaly_alert: "⚠️ *組織スコアに異常が検出されました*\n今月のスコアに注意が必要な変動があります。詳細はダッシュボードをご確認ください。",
  voice_check: "📝 *今月のボイスチェックの回答をお願いします*\n締切までに回答がない場合、データが欠損します。ご協力をお願いします。",
  kpi_reminder: "📈 *先月のKPI実績の入力をお願いします*\nまだ入力が完了していないKPI項目があります。ご確認ください。",
} as const;

export type SlackMessageKey = keyof typeof SLACK_MESSAGE_DEFAULTS;
