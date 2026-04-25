import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check Auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role verification: SuperAdmin
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userRecord?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { webhookUrl } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    const message = "🚨 *SignsAI System Alert* \n✅ SuperAdminからのテスト通知です。運営用Slack連携は正常に動作しています！";

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
            text: "🔧 システムの異常や、新規企業登録、方針変更などの通知がここに配信されます。"
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
    console.error("Test Admin Slack API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
