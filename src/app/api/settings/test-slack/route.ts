import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // `slack_webhook_url` と `slackUserId` をリクエストボディから取得
    const { webhookUrl, slackUserId } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    const message = slackUserId 
      ? `🎉 *SignsAI メンメンションテスト* \n✅ <@${slackUserId}> さん、SignsAIとの連携に成功しました！\nこのメンションが正しく青色で表示されていれば、ユーザーIDは正確です。`
      : "🎉 *SignsAI* \n✅ これはSignsAIからのテスト通知です。Slack連携は正常に動作しています！";

    const blocks = [
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

    const success = await sendSlackNotification(webhookUrl, "", blocks);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to send to Slack webhook." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Test Slack API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
