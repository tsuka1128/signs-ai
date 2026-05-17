import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "@/lib/slack";
import { SLACK_MESSAGE_DEFAULTS } from "@/lib/slack-message-defaults";
import { getBaseURL } from "@/lib/utils/index";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // `slack_webhook_url`, `slackUserId`, `previewType`, `customMessages` をリクエストボディから取得
    const { webhookUrl, slackUserId, previewType, customMessages } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    let message = "";
    let blocks: any[] = [];

    if (previewType === 'ai_summary') {
      const customText = customMessages?.slack_msg_ai_summary || SLACK_MESSAGE_DEFAULTS.ai_summary;
      message = "【サンプル】AIによる組織状態の分析が完了しました。";
      blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `🎉 *AIによる組織状態の分析が完了しました（サンプル）*\n\n${customText}`
          }
        },
        {
          "type": "actions",
          "elements": [{ "type": "button", "text": { "type": "plain_text", "text": "サンプルを見る" }, "url": `${getBaseURL()}/dashboard` }]
        }
      ];
    } else if (previewType === 'anomaly_alert') {
      const customText = customMessages?.slack_msg_anomaly_alert || SLACK_MESSAGE_DEFAULTS.anomaly_alert;
      message = "【サンプル】組織異常検知アラート";
      blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `🚨 *組織異常検知アラート（サンプル）*\n\n${customText}`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "・*急激なスコア下落*: 前月比 -12.5pt (サンプルデータ)"
          }
        },
        {
          "type": "actions",
          "elements": [{ "type": "button", "text": { "type": "plain_text", "text": "状況を確認する" }, "url": `${getBaseURL()}/dashboard`, "style": "danger" }]
        }
      ];
    } else if (previewType === 'voice_check_reminder') {
      const customText = customMessages?.slack_msg_voice_check || SLACK_MESSAGE_DEFAULTS.voice_check;
      message = "【サンプル】ボイスチェック未回答者への催促";
      blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `📢 *今月のボイスチェックへの回答をお願いします（サンプル）*\n\n${customText}`
          }
        }
      ];
    } else {
      message = slackUserId 
        ? `🎉 *SignsAI メンションテスト* \n✅ <@${slackUserId}> さん、SignsAIとの連携に成功しました！`
        : "🎉 *SignsAI* \n✅ これはSignsAIからのテスト通知です。Slack連携は正常に動作しています！";

      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: slackUserId 
                ? `💡 特定のメンバー（${slackUserId}）への個別メンションのテストです。`
                : "💡 SignsAIでは、毎月のAI分析結果やアンケートの配信状況がこのチャンネルへ通知されます。"
            }
          ]
        }
      ];
    }

    const success = await sendSlackNotification(webhookUrl, "", blocks);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to send to Slack webhook." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Test Slack API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
