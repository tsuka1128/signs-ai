/**
 * 認証関連のユーティリティ関数
 *
 * Supabase Auth を使った Google OAuth ログイン / ログアウトを管理します。
 */

import { createClient } from "./supabase";
import { getBaseURL } from "./utils/url";

/** Google OAuth ログインを開始する */
export async function signInWithGoogle(redirectToOption?: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectToOption || `${getBaseURL()}/auth/callback`,
        },
    });

    if (error) {
        console.error("Googleログインエラー:", error.message);
        throw error;
    }
}

/** ログアウトする */
export async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("ログアウトエラー:", error.message);
        throw error;
    }
}

/** 現在のユーザー情報を取得する（クライアント側） */
export async function getCurrentUser() {
    const supabase = createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        return null;
    }

    return user;
}
