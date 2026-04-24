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

  // クライアントサイドのエラーをより詳細に追跡するための設定
  widenClientFileUpload: true,

  // ソースマップをアップロードした後に削除（公開されないようにする）
  hideSourceMaps: true,

  // ログ出力を無効化
  disableLogger: true,

  // Vercel の Cron Jobs などを監視対象に含める設定
  automaticVercelMonitors: true,
});
