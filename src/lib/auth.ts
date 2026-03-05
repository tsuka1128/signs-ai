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

/** メールアドレスとパスワードでサインアップする */
export async function signUpWithEmail(email: string, password: string, redirectToOption?: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectToOption || `${getBaseURL()}/auth/callback`,
        },
    });

    if (error) {
        console.error("サインアップエラー:", error.message);
        throw error;
    }
    return data;
}

/** メールアドレスとパスワードでサインインする */
export async function signInWithEmail(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("サインインエラー:", error.message);
        throw error;
    }
    return data;
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
