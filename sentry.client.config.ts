import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture 100% of sessions with errors, 10% without
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Mask all text for medical data privacy
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
