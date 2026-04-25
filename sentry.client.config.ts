import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 本番環境ではパフォーマンス向上のためサンプリング率を下げます（10%）
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // セッションリプレイの設定
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // デバッグモード（開発環境のみ有効にすることを推奨）
  debug: false,
});
