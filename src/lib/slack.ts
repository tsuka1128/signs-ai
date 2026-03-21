/**
 * Slack Webhookにメッセージを送信する共通関数
 * @param webhookUrl Slack Incoming Webhook URL
 * @param text メッセージテキスト（フォールバック用やプレーンテキストとして）
 * @param blocks リッチフォーマット（Block Kit）のオプション配列
 */
export async function sendSlackNotification(
  webhookUrl: string,
  text: string,
  blocks?: any[]
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    console.error("Invalid Slack Webhook URL");
    return false;
  }

  const payload: any = { text };
  if (blocks && blocks.length > 0) {
    payload.blocks = blocks;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Slack Notification Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Slack Notification Error:", error);
    return false;
  }
}
