import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  // Sample 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
});
