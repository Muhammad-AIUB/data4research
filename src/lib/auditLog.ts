// ====================================================
// STRUCTURED AUDIT LOGGING — Write actions
// ====================================================
// Machine-readable JSON logs for regulated medical system compliance.
// Captures: who did what, to which entity, and when.
//
// Output: structured JSON to stdout (console.log).
// In production, pipe stdout to a log aggregator (e.g. Datadog, CloudWatch).

export type AuditAction =
  | "CREATE_PATIENT"
  | "UPDATE_PATIENT"
  | "DELETE_PATIENT"
  | "CREATE_PATIENT_TEST";

interface AuditEntry {
  level: "AUDIT";
  timestamp: string;
  requestId: string;
  actorUserId: string;
  action: AuditAction;
  entityType: "Patient" | "PatientTest";
  entityId: string;
}

/**
 * Emit a structured audit log entry for a write operation.
 * Uses console.log so it flows through stdout to any log collector.
 */
export function auditLog(
  requestId: string,
  actorUserId: string,
  action: AuditAction,
  entityType: AuditEntry["entityType"],
  entityId: string,
): void {
  const entry: AuditEntry = {
    level: "AUDIT",
    timestamp: new Date().toISOString(),
    requestId,
    actorUserId,
    action,
    entityType,
    entityId,
  };
  // Structured JSON — one line per event for log aggregation
  console.log(JSON.stringify(entry));
}
