/**
 * Audit Logging Service for API Key Operations
 * Logs security-sensitive operations to console and error logs
 */

export interface AuditLogEntry {
  userId: number;
  action: "read" | "create" | "update" | "delete" | "test";
  settingKey: string;
  settingSection?: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event for API key operations
 * In production, this should write to a dedicated audit log table or external service
 */
export function logAuditEvent(entry: AuditLogEntry): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[AUDIT] ${timestamp} | User:${entry.userId} | Action:${entry.action} | Key:${entry.settingKey} | Success:${entry.success}${entry.errorMessage ? ` | Error:${entry.errorMessage}` : ""}`;
  
  if (entry.success) {
    console.info(logMessage);
  } else {
    console.warn(logMessage);
  }
  
  // In production, you would also write to a database table or external audit service
  // Example: await db.insert(auditLogs).values({ ...entry, timestamp });
}

/**
 * Log API key read operation
 */
export function logApiKeyRead(userId: number, settingKey: string): void {
  logAuditEvent({
    userId,
    action: "read",
    settingKey,
    success: true,
  });
}

/**
 * Log API key create/update operation
 */
export function logApiKeyWrite(
  userId: number,
  settingKey: string,
  action: "create" | "update",
  success: boolean = true,
  errorMessage?: string
): void {
  logAuditEvent({
    userId,
    action,
    settingKey,
    success,
    errorMessage,
  });
}

/**
 * Log API key test operation
 */
export function logApiKeyTest(
  userId: number,
  service: string,
  success: boolean,
  errorMessage?: string
): void {
  logAuditEvent({
    userId,
    action: "test",
    settingKey: service,
    success,
    errorMessage,
  });
}

/**
 * Log API key delete operation
 */
export function logApiKeyDelete(
  userId: number,
  settingKey: string,
  success: boolean = true,
  errorMessage?: string
): void {
  logAuditEvent({
    userId,
    action: "delete",
    settingKey,
    success,
    errorMessage,
  });
}
