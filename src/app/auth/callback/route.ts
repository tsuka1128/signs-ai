/**
 * Auth コールバックルート
 *
 * Google OAuth 認証後にリダイレクトされるエンドポイント。
 * 認証コードを受け取り、セッションに変換してからダッシュボードへ転送します。
 */

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=no_code`);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("認証コード交換エラー:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // 認証成功後：users テーブルにプロフィールがない場合はオンボーディングへ
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        const { data: profile } = await supabase
            .from("users")
            .select("id, company_id")
            .eq("id", user.id)
            .single();

        // 初回ログイン or company_id がなければオンボーディングへ
        if (!profile?.company_id) {
            return NextResponse.redirect(`${origin}/onboarding`);
        }
    }

    return NextResponse.redirect(`${origin}${next}`);
}
