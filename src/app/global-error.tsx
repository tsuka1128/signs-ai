"use client";

/**
 * グローバルエラーバウンダリ（ルートレイアウト自体の例外を捕捉）
 * error.tsx はページ配下の例外を捕捉するが、root layout で発生した例外は
 * global-error.tsx でしか捕捉できないため、Sentry への送信をここでも行う。
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
        console.error("[Signs AI Fatal Error]:", error);
    }, [error]);

    return (
        <html lang="ja">
            <body
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, sans-serif",
                    background: "#f8fafc",
                    color: "#1e293b",
                    margin: 0,
                    padding: "24px",
                }}
            >
                <div style={{ textAlign: "center", maxWidth: "420px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>
                        問題が発生しました
                    </h1>
                    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px", lineHeight: 1.6 }}>
                        予期しないエラーにより、処理を中断しました。
                        <br />
                        システム管理者に通知されました。再試行をお願いします。
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "12px 24px",
                            background: "#0f172a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        もう一度試す
                    </button>
                </div>
            </body>
        </html>
    );
}
