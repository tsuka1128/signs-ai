import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// =====================================================
// GET: 所属企業に紐づくSlackチャンネル一覧を取得
// =====================================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ユーザープロフィールから企業IDとロールを取得
    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 管理者ロール以上のアクセス制限
    if (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'executive') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. チャンネル一覧の取得
    const { data: channels, error: fetchError } = await supabase
      .from("slack_channels")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Failed to fetch slack channels:", fetchError);
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }

    return NextResponse.json({ channels });

  } catch (error) {
    console.error("Slack Channels GET API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// =====================================================
// POST: 新規Slackチャンネルの作成
// =====================================================
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. 認証 & 権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. リクエストデータの取得
    const body = await req.json();
    const { name, channel_type, department_id, webhook_url } = body;

    if (!name || !channel_type || !webhook_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. channel_type に応じたスマートデフォルト（プリセット）の注入
    let notify_ai_summary = false;
    let notify_anomaly_alert = false;
    let notify_voice_check_reminder = false;
    let notify_voice_check_feedback = false;
    let notify_kpi_reminder = false;

    if (channel_type === 'company' || channel_type === 'executive') {
      notify_ai_summary = true;
      notify_anomaly_alert = true;
    } else if (channel_type === 'department') {
      notify_voice_check_reminder = true;
      notify_voice_check_feedback = true;
      notify_kpi_reminder = true;
    }

    // 4. レコードのインサート
    const { data: channel, error: insertError } = await supabase
      .from("slack_channels")
      .insert({
        company_id: profile.company_id,
        name,
        channel_type,
        department_id: channel_type === 'department' ? department_id : null,
        webhook_url,
        notify_ai_summary,
        notify_anomaly_alert,
        notify_voice_check_reminder,
        notify_voice_check_feedback,
        notify_kpi_reminder
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert slack channel:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, channel });

  } catch (error) {
    console.error("Slack Channels POST API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// =====================================================
// PUT: 既存のSlackチャンネル設定の更新
// =====================================================
export async function PUT(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. 認証 & 権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. リクエストデータの取得
    const body = await req.json();
    const { id, name, webhook_url, notify_ai_summary, notify_anomaly_alert, notify_voice_check_reminder, notify_voice_check_feedback, notify_kpi_reminder } = body;

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    // 3. 更新処理 (自社のレコードである検証を company_id 制約で担保)
    const { data: channel, error: updateError } = await supabase
      .from("slack_channels")
      .update({
        name,
        webhook_url,
        notify_ai_summary,
        notify_anomaly_alert,
        notify_voice_check_reminder,
        notify_voice_check_feedback,
        notify_kpi_reminder,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update slack channel:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, channel });

  } catch (error) {
    console.error("Slack Channels PUT API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// =====================================================
// DELETE: Slackチャンネルの削除
// =====================================================
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. 認証 & 権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. 削除対象の取得
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    // 3. 削除処理 (自社レコード制約)
    const { error: deleteError } = await supabase
      .from("slack_channels")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (deleteError) {
      console.error("Failed to delete slack channel:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Slack Channels DELETE API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
