import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendInvitationEmail } from "@/lib/mail";
import { NextRequest, NextResponse } from "next/server";
import { getBaseURL } from "@/lib/utils/index";

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

    // ── 招待レート制限（スパム防止） ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentInvitesCount, error: countError } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("company_id", effectiveCompanyId)
        .gt("created_at", oneHourAgo);

    if (countError) {
        console.error("招待件数チェックエラー:", countError);
    } else if (recentInvitesCount !== null && recentInvitesCount >= 20 && !isSuperAdmin) {
        return NextResponse.json({ 
            message: "1時間あたりの招待上限（20件）に達しました。時間を置いてから再度お試しください。" 
        }, { status: 429 });
    }

    // 同一メアド・同一企業の既存 pending 招待を無効化
    // これにより、オンボーディング時の .single() 取得エラーと、古いリンクの悪用を防止します。
    const { error: cancelError } = await supabase
        .from("invitations")
        .update({ 
            status: "cancelled",
            deleted_at: new Date().toISOString()
        } as any)
        .eq("company_id", effectiveCompanyId)
        .eq("email", email.trim())
        .eq("status", "pending");

    if (cancelError) {
        console.error("既存招待のキャンセルエラー:", cancelError);
        // キャンセル失敗は致命的ではないため続行
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
        .select("id, token")
        .single();

    if (inviteError) {
        console.error("招待作成エラー:", inviteError);
        return NextResponse.json({ message: "招待の作成に失敗しました" }, { status: 500 });
    }

    // 4. 招待メールの送信
    let emailSent = false;
    try {
        // 企業名を取得してメールに含める
        const { data: companyInfo } = await supabase
            .from("companies")
            .select("name")
            .eq("id", effectiveCompanyId)
            .single();

        const companyName = companyInfo?.name || "Signs AI";
        const inviteUrl = `${getBaseURL()}/onboarding#token=${invitation.token}`;

        await sendInvitationEmail(email.trim(), companyName, inviteUrl);
        emailSent = true;

        // 送信日時を記録
        await supabase.from('invitations').update({
            updated_at: new Date().toISOString()
        } as any).eq('id', invitation.id);
    } catch (emailError: any) {
        // メール送信に失敗しても招待自体は作成済みなので、警告付きで成功を返す
        console.error("招待メール送信エラー:", emailError.message);
    }

    return NextResponse.json({
        success: true,
        token: invitation.token,
        emailSent,
        ...(emailSent ? {} : { warning: "招待は作成されましたが、メールの送信に失敗しました。手動でリンクを共有してください。" })
    });
}
