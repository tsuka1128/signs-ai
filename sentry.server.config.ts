import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 1.0 に設定するとすべてのトランザクションをキャプチャします。
  tracesSampleRate: 1.0,

  // デバッグモード
  debug: false,
});
