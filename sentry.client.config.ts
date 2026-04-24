import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 1.0 に設定するとすべてのトランザクションをキャプチャします。
  // 本番環境ではパフォーマンス向上のため、この値を調整することを推奨します。
  tracesSampleRate: 1.0,

  // セッションリプレイの設定
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // デバッグモード（開発環境のみ有効にすることを推奨）
  debug: false,
});
