import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { tasks, type InsertTask } from "../../drizzle/schema";

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTasksByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.dueDate));
}

export async function getTasksByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.leadId, leadId)).orderBy(desc(tasks.dueDate));
}

export async function getTasksByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.campaignId, campaignId)).orderBy(desc(tasks.dueDate));
}

export async function getOverdueTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "pending"),
        lte(tasks.dueDate, now)
      )
    )
    .orderBy(desc(tasks.dueDate));
}

export async function getUpcomingTasks(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "pending"),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, future)
      )
    )
    .orderBy(tasks.dueDate);
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function completeTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTaskStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, completed: 0, overdue: 0 };

  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  
  const now = new Date();
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === "pending").length,
    completed: allTasks.filter(t => t.status === "completed").length,
    overdue: allTasks.filter(t => 
      t.status === "pending" && 
      t.dueDate && 
      new Date(t.dueDate) < now
    ).length,
  };

  return stats;
}
