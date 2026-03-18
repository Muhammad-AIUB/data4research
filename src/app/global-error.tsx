"use client";

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
    console.error("Global error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-100">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="rounded-xl bg-white p-8 shadow-lg text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
