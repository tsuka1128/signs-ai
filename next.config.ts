import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // barrel import を per-module に最適化してツリーシェイクを確実化（lucide は 95 ファイルで使用）
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
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

  // SentryがAPIルートをEdge Runtimeでラップするのを防ぐ
  // （AIルートはNode.js Runtimeが必要なため）
  autoInstrumentServerFunctions: false,
});
