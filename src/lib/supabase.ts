/**
 * Supabase クライアント初期化
 *
 * ブラウザ側（Client Component）からの接続に使用するクライアントを生成します。
 * サーバー側の処理には別途 createServerClient を使用してください。
 */

import { createBrowserClient } from "@supabase/ssr";

/** Supabase の接続に必要な環境変数 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * ブラウザ用 Supabase クライアントを生成する
 * @returns Supabase Client インスタンス
 */
export function createClient() {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
