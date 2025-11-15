import { getDb } from "../db";
import { apiSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Helper to retrieve API settings from key-value structure
 */

export async function getApiSetting(
  userId: number,
  section: string,
  key: string
): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(apiSettings)
    .where(
      and(
        eq(apiSettings.userId, userId),
        eq(apiSettings.section, section),
        eq(apiSettings.key, key)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].value : null;
}

export async function getApiSettings(
  userId: number,
  section: string
): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(apiSettings)
    .where(
      and(
        eq(apiSettings.userId, userId),
        eq(apiSettings.section, section)
      )
    );

  const settings: Record<string, string> = {};
  results.forEach((setting) => {
    settings[setting.key] = setting.value;
  });

  return settings;
}
