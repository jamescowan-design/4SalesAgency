import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  campaigns,
  leads,
  productKnowledge,
  knowledgeDocuments,
  campaignLlmConfig,
  activities,
  communicationLogs,
  emailTemplates,
  voiceCallSessions,
  callScripts,
  scrapedData,
  recruitmentIntelligence,
  auditLogs,
  errorLogs,
  InsertClient,
  InsertCampaign,
  InsertLead,
  InsertProductKnowledge,
  InsertKnowledgeDocument,
  InsertCampaignLlmConfig,
  InsertActivity,
  InsertCommunicationLog,
  InsertEmailTemplate,
  InsertVoiceCallSession,
  InsertCallScript,
  InsertScrapedData,
  InsertRecruitmentIntelligence,
  InsertAuditLog,
  InsertErrorLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(clients).values(data);
  return result.insertId;
}

export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clients).where(eq(clients.id, id));
}

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(campaigns).values(data);
  return result.insertId;
}

export async function getCampaignsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(campaigns).where(eq(campaigns.clientId, clientId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(leads).values(data);
  return result.insertId;
}

export async function getLeadsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(leads).where(eq(leads.campaignId, campaignId)).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(leads).where(eq(leads.id, id));
}

export async function updateLeadStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads).set({ status: status as any }).where(eq(leads.id, id));
}

// ============================================================================
// PRODUCT KNOWLEDGE
// ============================================================================

export async function createProductKnowledge(data: InsertProductKnowledge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(productKnowledge).values(data);
  return result.insertId;
}

export async function getProductKnowledgeByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(productKnowledge).where(eq(productKnowledge.campaignId, campaignId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProductKnowledge(id: number, data: Partial<InsertProductKnowledge>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(productKnowledge).set(data).where(eq(productKnowledge.id, id));
}

// ============================================================================
// KNOWLEDGE DOCUMENTS
// ============================================================================

export async function createKnowledgeDocument(data: InsertKnowledgeDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(knowledgeDocuments).values(data);
  return result.insertId;
}

export async function getKnowledgeDocumentsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.campaignId, campaignId)).orderBy(desc(knowledgeDocuments.createdAt));
}

// ============================================================================
// CAMPAIGN LLM CONFIG
// ============================================================================

export async function createCampaignLlmConfig(data: InsertCampaignLlmConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(campaignLlmConfig).values(data);
  return result.insertId;
}

export async function getCampaignLlmConfigByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaignLlmConfig).where(eq(campaignLlmConfig.campaignId, campaignId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCampaignLlmConfig(id: number, data: Partial<InsertCampaignLlmConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(campaignLlmConfig).set(data).where(eq(campaignLlmConfig.id, id));
}

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function createActivity(data: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(activities).values(data);
  return result.insertId;
}

export async function getActivitiesByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activities).where(eq(activities.leadId, leadId)).orderBy(desc(activities.createdAt));
}

export async function getActivitiesByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activities).where(eq(activities.campaignId, campaignId)).orderBy(desc(activities.createdAt));
}

// ============================================================================
// COMMUNICATION LOGS
// ============================================================================

export async function createCommunicationLog(data: InsertCommunicationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(communicationLogs).values(data);
  return result.insertId;
}

export async function getCommunicationLogsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(communicationLogs).where(eq(communicationLogs.leadId, leadId)).orderBy(desc(communicationLogs.createdAt));
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function createEmailTemplate(data: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(emailTemplates).values(data);
  return result.insertId;
}

export async function getEmailTemplatesByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(emailTemplates).where(eq(emailTemplates.campaignId, campaignId)).orderBy(desc(emailTemplates.createdAt));
}

// ============================================================================
// VOICE CALL SESSIONS
// ============================================================================

export async function createVoiceCallSession(data: InsertVoiceCallSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(voiceCallSessions).values(data);
  return result.insertId;
}

export async function getVoiceCallSessionsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(voiceCallSessions).where(eq(voiceCallSessions.leadId, leadId)).orderBy(desc(voiceCallSessions.createdAt));
}

export async function updateVoiceCallSession(id: number, data: Partial<InsertVoiceCallSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(voiceCallSessions).set(data).where(eq(voiceCallSessions.id, id));
}

// ============================================================================
// CALL SCRIPTS
// ============================================================================

export async function createCallScript(data: InsertCallScript) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(callScripts).values(data);
  return result.insertId;
}

export async function getCallScriptsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(callScripts).where(eq(callScripts.campaignId, campaignId)).orderBy(desc(callScripts.createdAt));
}

// ============================================================================
// SCRAPED DATA
// ============================================================================

export async function createScrapedData(data: InsertScrapedData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(scrapedData).values(data);
  return result.insertId;
}

export async function getScrapedDataByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(scrapedData).where(eq(scrapedData.leadId, leadId)).orderBy(desc(scrapedData.scrapedAt));
}

// ============================================================================
// RECRUITMENT INTELLIGENCE
// ============================================================================

export async function createRecruitmentIntelligence(data: InsertRecruitmentIntelligence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(recruitmentIntelligence).values(data);
  return result.insertId;
}

export async function getRecruitmentIntelligenceByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(recruitmentIntelligence).where(eq(recruitmentIntelligence.leadId, leadId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRecruitmentIntelligence(id: number, data: Partial<InsertRecruitmentIntelligence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(recruitmentIntelligence).set(data).where(eq(recruitmentIntelligence.id, id));
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

// ============================================================================
// ERROR LOGS
// ============================================================================

export async function createErrorLog(data: InsertErrorLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(errorLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create error log:", error);
  }
}

export async function getUnresolvedErrors() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(errorLogs).where(eq(errorLogs.resolved, false)).orderBy(desc(errorLogs.createdAt)).limit(100);
}
