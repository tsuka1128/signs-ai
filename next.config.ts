import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // フォーマット詳細は Sentry のドキュメントを参照してください:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // ビルド時のログを抑制
  silent: !process.env.CI,

  // ソースマップ関連の設定（必要に応じて調整）
  widenClientFileUpload: true,

  // ログ出力を無効化
  disableLogger: true,
});
