// ====================================================
// REQUEST CORRELATION ID — Observability helper
// ====================================================
// Generates a UUID per request for tracing through logs and error responses.
// Only surfaces the requestId in non-2xx responses to avoid polluting success payloads.

import { randomUUID } from "crypto";

/** Generate a unique request correlation ID. */
export function createRequestId(): string {
  return randomUUID();
}
