import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabaseClient();

    // 1. 認証と権限確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // ユーザーの company_id と role を取得
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_id, role")
        .eq("id", user.id)
        .single();

    if (userError || !userData?.company_id) {
        return NextResponse.json({ message: "組織情報が見つかりません" }, { status: 403 });
    }

    // 管理者以上のみ招待可能とする
    if (!["admin", "executive", "owner"].includes(userData.role)) {
        return NextResponse.json({ message: "招待権限がありません" }, { status: 403 });
    }

    // 2. リクエストボディの取得
    const { email, role } = await req.json();
    if (!email || !role) {
        return NextResponse.json({ message: "メールアドレスとロールは必須です" }, { status: 400 });
    }

    // 3. 招待データの作成
    const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
            company_id: userData.company_id,
            inviter_id: user.id,
            email: email.trim(),
            role: role,
            status: "pending",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日間
        })
        .select("token")
        .single();

    if (inviteError) {
        console.error("招待作成エラー:", inviteError);
        return NextResponse.json({ message: "招待の作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: invitation.token });
}
