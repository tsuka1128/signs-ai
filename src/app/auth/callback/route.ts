/**
 * Auth コールバックルート
 *
 * Google OAuth 認証後にリダイレクトされるエンドポイント。
 * 認証コードを受け取り、セッションに変換してからダッシュボードへ転送します。
 */

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { getBaseURL } from "@/lib/utils";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";
    const type = searchParams.get("type"); // recovery 等

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=no_code`);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("認証コード交換エラー:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // 認証成功後：リカバリーフローの場合は最優先でパスワード更新画面へ
    // urlのクエリパラメータ、またはSupabaseが自動付与するnextパラメータに recovery が含まれる場合
    if (type === "recovery" || next.includes("recovery") || next.includes("type=recovery")) {
        return NextResponse.redirect(`${origin}/password-update`);
    }
    
    // users テーブルにプロフィールがない場合はオンボーディングへ
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const token = searchParams.get("token");

    if (user) {
        const { data: profile } = await supabase
            .from("users")
            .select("id, company_id")
            .eq("id", user.id)
            .single();

        // 初回ログイン or company_id がなければオンボーディングへ
        if (!profile?.company_id) {
            const onboardingUrl = token
                ? `${origin}/onboarding?token=${encodeURIComponent(token)}`
                : `${origin}/onboarding`;
            return NextResponse.redirect(onboardingUrl);
        }
    }

    return NextResponse.redirect(`${origin}${next}`);
}
