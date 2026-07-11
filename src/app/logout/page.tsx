"use client";

/**
 * ログアウト専用ルート
 *
 * どの画面からでも `/logout` に来れば、確実にセッションを破棄して
 * ログイン画面へ戻れる「脱出口」。
 *
 * 背景: ログイン済みユーザーが /login を開くと Middleware が / へ送り返すため、
 * オンボーディング等に閉じ込められた際にログイン画面へ辿り着けなくなる。
 * その回避のため、明示的にサインアウトする専用ルートを用意する。
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Loading } from "@/components/ui/Loading";

export default function LogoutPage() {
    useEffect(() => {
        const run = async () => {
            try {
                const supabase = createClient();
                await supabase.auth.signOut();
            } catch (err) {
                console.error("ログアウト処理でエラー:", err);
            } finally {
                // なりすまし状態も必ずクリア
                try {
                    localStorage.removeItem("impersonated_company_id");
                } catch {
                    /* localStorage 不可の環境は無視 */
                }
                // 履歴を上書きし、戻るボタンでループに戻らないようにする
                window.location.replace("/login");
            }
        };
        run();
    }, []);

    return <Loading fullScreen message="ログアウトしています..." />;
}
