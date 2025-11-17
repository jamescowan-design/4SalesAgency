import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { exportLogs, type InsertExportLog } from "../../drizzle/schema";

export async function createExportLog(log: InsertExportLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(exportLogs).values(log);
  return result[0].insertId;
}

export async function getExportById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(exportLogs).where(eq(exportLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getExportsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(exportLogs)
    .where(eq(exportLogs.userId, userId))
    .orderBy(desc(exportLogs.exportedAt))
    .limit(limit);
}

export async function updateExportStatus(
  id: number,
  status: "pending" | "success" | "failed",
  recordsExported?: number,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(exportLogs)
    .set({
      status,
      recordsExported,
      errorMessage,
      completedAt: new Date(),
    })
    .where(eq(exportLogs.id, id));
}

export async function getExportStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, failed: 0, totalRecords: 0 };

  const allExports = await db.select().from(exportLogs).where(eq(exportLogs.userId, userId));

  const stats = {
    total: allExports.length,
    success: allExports.filter((e) => e.status === "success").length,
    failed: allExports.filter((e) => e.status === "failed").length,
    totalRecords: allExports.reduce((sum, e) => sum + (e.recordsExported || 0), 0),
  };

  return stats;
}
