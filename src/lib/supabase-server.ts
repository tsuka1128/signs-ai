/**
 * Supabase サーバーサイドクライアント
 *
 * Server Component や API Route から Supabase にアクセスする際に使用します。
 * Cookie を介したセッション管理を行います。
 */

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Supabase の接続に必要な環境変数 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * サーバーサイド用 Supabase クライアントを生成する
 * Next.js の cookies() を使用してセッションを管理する
 * @returns Supabase Client インスタンス
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Server Component からの呼び出し時は set が使えないため無視
                }
            },
        },
    });
}

/**
 * サービスロール（RLS バイパス）の Supabase クライアントを生成する。
 *
 * 通常の操作には使用しない。RLS では実行できない管理操作（オンボーディング失敗時の
 * 企業レコード削除など）に限って使用する。SUPABASE_SERVICE_ROLE_KEY が未設定の場合は
 * null を返すため、呼び出し側でフォールバックすること。
 */
export function createServiceRoleClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
