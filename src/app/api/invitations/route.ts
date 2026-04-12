import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabaseClient();

    // 1. 認証と権限確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // 2. リクエストボディの取得
    const { email, role, department_id, axis_id, slack_user_id, targetCompanyId } = await req.json();
    if (!email || !role) {
        return NextResponse.json({ message: "メールアドレスとロールは必須です" }, { status: 400 });
    }

    // 実行ユーザーのプロフィール取得
    const { data: userData } = await supabase
        .from("users")
        .select("company_id, role")
        .eq("id", user.id)
        .single();

    // 管理者以外で company_id がない場合（未所属）はエラー
    if (!userData?.company_id && userData?.role !== 'super_admin') {
        return NextResponse.json({ message: "組織情報が見つかりません" }, { status: 403 });
    }

    // 代理ログイン ID の調整 (super_admin の場合のみ targetCompanyId を優先)
    let effectiveCompanyId = userData?.company_id;
    const isSuperAdmin = userData?.role === 'super_admin';

    if (isSuperAdmin && targetCompanyId) {
        effectiveCompanyId = targetCompanyId;
    }

    if (!effectiveCompanyId) {
        return NextResponse.json({ message: "対象の組織を指定してください" }, { status: 400 });
    }

    // 権限チェック (管理者以上のみ招待可能)
    if (!isSuperAdmin && !["admin", "executive", "owner"].includes(userData?.role || "")) {
        return NextResponse.json({ message: "招待権限がありません" }, { status: 403 });
    }

    // 3. 招待データの作成
    const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
            company_id: effectiveCompanyId,
            inviter_id: user.id,
            email: email.trim(),
            role: role,
            department_id: department_id || null,
            axis_id: axis_id || null,
            slack_user_id: slack_user_id || null,
            status: "pending",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日間
        })
        .select("token")
        .single();

    if (inviteError) {
        console.error("招待作成エラー:", inviteError);
        return NextResponse.json({ message: "招待の作成に失敗しました" }, { status: 500 });
    }

    // 4. メール送信 (将来的に Resend 等の API 連携を行う場所)
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });

    return NextResponse.json({ success: true, token: invitation.token });
}
