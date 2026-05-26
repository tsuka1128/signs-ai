import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "@/lib/slack";

// =====================================================
// POST: 保存済みSlackチャンネルへの疎通検証テスト送信
// =====================================================
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ユーザープロフィールの取得と権限検証
    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id || (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'executive')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await props.params;
    const { id } = params;

    // 3. 対象のチャンネルレコードをクエリ（必ず自社のレコードであることを保証）
    const { data: channel, error: fetchError } = await supabase
      .from("slack_channels")
      .select("webhook_url, name, channel_type")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (fetchError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 4. テスト通知メッセージの組み立て
    const icon = channel.channel_type === 'company' ? '🏢' : channel.channel_type === 'department' ? '👥' : channel.channel_type === 'executive' ? '👑' : '📌';
    const typeLabel = channel.channel_type === 'company' ? '全社' : channel.channel_type === 'department' ? '部署別' : channel.channel_type === 'executive' ? '経営陣' : 'カスタム';
    const message = `🎉 *SignsAI 接続テスト* \n✅ 「${channel.name}」（${typeLabel} ${icon}）との連携に成功しました！\nこれはSignsAIから送信されたテスト通知です。`;

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
            text: "💡 このチャンネルでは、設定された通知ON/OFF設定に基づいて、AI分析サマリーやリマインダーが安全に自動配信されます。"
          }
        ]
      }
    ];

    // 送信実行
    const success = await sendSlackNotification(channel.webhook_url, "", blocks);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to send to Slack webhook." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Saved Slack Channel Test API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
