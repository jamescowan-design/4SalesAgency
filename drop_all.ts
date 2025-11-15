import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL!);

const tables = [
  "auditLogs", "errorLogs", "recruitmentIntelligence", "scrapedData",
  "callScripts", "voiceCallSessions", "emailTemplates", "communicationLogs",
  "activities", "leads", "campaignLlmConfig", "knowledgeDocuments",
  "productKnowledge", "campaigns", "clients", "users"
];

for (const table of tables) {
  try {
    await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`Dropped ${table}`);
  } catch (e) {
    console.log(`Skip ${table}: ${e.message}`);
  }
}

console.log("All tables dropped");
