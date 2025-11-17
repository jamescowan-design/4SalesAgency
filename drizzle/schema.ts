import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * 4 Sales Agency Database Schema
 * Multi-tenant B2B lead generation platform with Virtual LLM capabilities
 */

// ============================================================================
// CORE TABLES
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of this client
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  website: varchar("website", { length: 500 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(), // Campaign creator
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  
  // ICP (Ideal Customer Profile) targeting criteria
  targetIndustries: json("targetIndustries").$type<string[]>(),
  targetGeographies: json("targetGeographies").$type<string[]>(),
  companySizeMin: int("companySizeMin").default(1),
  companySizeMax: int("companySizeMax").default(10000),
  revenueMin: int("revenueMin").default(0),
  revenueMax: int("revenueMax").default(1000000000),
  targetJobTitles: json("targetJobTitles").$type<string[]>(),
  
  // Campaign metrics
  confidenceThreshold: int("confidenceThreshold").default(70), // 0-100
  leadsGenerated: int("leadsGenerated").default(0),
  leadsQualified: int("leadsQualified").default(0),
  leadsContacted: int("leadsContacted").default(0),
  
  // Dates
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  
  // Company information
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyWebsite: varchar("companyWebsite", { length: 500 }),
  companyIndustry: varchar("companyIndustry", { length: 255 }),
  companySize: int("companySize"),
  companyRevenue: int("companyRevenue"),
  companyLocation: varchar("companyLocation", { length: 255 }),
  
  // Contact information
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  contactJobTitle: varchar("contactJobTitle", { length: 255 }),
  contactLinkedin: varchar("contactLinkedin", { length: 500 }),
  
  // Lead scoring and status
  confidenceScore: int("confidenceScore").default(0), // 0-100
  status: mysqlEnum("status", ["new", "contacted", "responded", "qualified", "unqualified", "converted", "rejected"]).default("new").notNull(),
  
  // Metadata
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  notes: text("notes"),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// VIRTUAL LLM & KNOWLEDGE BASE
// ============================================================================

export const productKnowledge = mysqlTable("productKnowledge", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  
  // Product/Service information
  productName: varchar("productName", { length: 255 }),
  productDescription: text("productDescription"),
  keyFeatures: json("keyFeatures").$type<string[]>(),
  benefits: json("benefits").$type<string[]>(),
  useCases: json("useCases").$type<string[]>(),
  pricingInfo: text("pricingInfo"),
  targetMarket: text("targetMarket"),
  competitiveAdvantages: json("competitiveAdvantages").$type<string[]>(),
  painPointsAddressed: json("painPointsAddressed").$type<string[]>(),
  
  // Sales enablement
  valueProposition: text("valueProposition"),
  salesTalkingPoints: json("salesTalkingPoints").$type<string[]>(),
  commonObjections: json("commonObjections").$type<{objection: string, response: string}[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const knowledgeDocuments = mysqlTable("knowledgeDocuments", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  
  documentType: mysqlEnum("documentType", ["pdf", "text", "transcript", "recording", "other"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize"), // bytes
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Processed content
  extractedText: text("extractedText"),
  summary: text("summary"),
  keyInsights: json("keyInsights").$type<string[]>(),
  
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const campaignLlmConfig = mysqlTable("campaignLlmConfig", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().unique(),
  
  // LLM configuration
  modelName: varchar("modelName", { length: 100 }).default("gpt-4"),
  temperature: int("temperature").default(70), // 0-100 (will be converted to 0.0-1.0)
  maxTokens: int("maxTokens").default(1000),
  systemPrompt: text("systemPrompt"),
  
  // Tone and style
  emailTone: mysqlEnum("emailTone", ["professional", "casual", "friendly", "formal", "consultative"]).default("professional"),
  personalizationLevel: mysqlEnum("personalizationLevel", ["low", "medium", "high"]).default("medium"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// COMMUNICATION & ACTIVITIES
// ============================================================================

export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  campaignId: int("campaignId").notNull(),
  userId: int("userId"),
  
  activityType: mysqlEnum("activityType", ["email", "call", "sms", "note", "task", "meeting"]).notNull(),
  subject: varchar("subject", { length: 500 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communicationLogs = mysqlTable("communicationLogs", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  campaignId: int("campaignId").notNull(),
  
  communicationType: mysqlEnum("communicationType", ["email", "call", "sms"]).notNull(),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  
  // Email specific
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  
  // Status tracking
  status: mysqlEnum("status", ["sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"]).default("sent").notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
  
  // Timestamps
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  userId: int("userId"),
  
  templateName: varchar("templateName", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyTemplate: text("bodyTemplate").notNull(),
  variables: json("variables").$type<string[]>(),
  
  // AI generated flag
  isAiGenerated: boolean("isAiGenerated").default(false),
  
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// VOICE CALLING
// ============================================================================

export const voiceCallSessions = mysqlTable("voiceCallSessions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  campaignId: int("campaignId").notNull(),
  
  // Call identifiers
  callSid: varchar("callSid", { length: 255 }).unique(),
  vapiCallId: varchar("vapiCallId", { length: 255 }),
  
  // Call details
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  duration: int("duration"), // seconds
  status: mysqlEnum("status", ["initiated", "ringing", "in_progress", "completed", "failed", "no_answer", "busy"]).default("initiated").notNull(),
  
  // Recording and transcript
  recordingUrl: varchar("recordingUrl", { length: 500 }),
  transcript: text("transcript"),
  
  // AI analysis
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  keyTopics: json("keyTopics").$type<string[]>(),
  nextAction: text("nextAction"),
  
  callStartedAt: timestamp("callStartedAt"),
  callEndedAt: timestamp("callEndedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const callScripts = mysqlTable("callScripts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId"),
  
  scriptName: varchar("scriptName", { length: 255 }),
  
  // Script sections
  introduction: text("introduction"),
  discoveryQuestions: json("discoveryQuestions").$type<string[]>(),
  valueProposition: text("valueProposition"),
  productPitch: text("productPitch"),
  objectionHandling: json("objectionHandling").$type<{objection: string, response: string}[]>(),
  closingStatement: text("closingStatement"),
  
  isAiGenerated: boolean("isAiGenerated").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// WEB SCRAPING & ENRICHMENT
// ============================================================================

export const scrapedData = mysqlTable("scrapedData", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  dataType: mysqlEnum("dataType", ["company_info", "product_info", "contact_info", "job_posting", "news", "other"]).notNull(),
  
  rawData: json("rawData").$type<Record<string, any>>(),
  processedData: json("processedData").$type<Record<string, any>>(),
  
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recruitmentIntelligence = mysqlTable("recruitmentIntelligence", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  
  companyName: varchar("companyName", { length: 255 }).notNull(),
  
  // Hiring signals
  hiringSignals: json("hiringSignals").$type<string[]>(),
  jobPostings: json("jobPostings").$type<{title: string, department: string, location: string, url: string}[]>(),
  
  // Growth indicators
  growthIndicators: json("growthIndicators").$type<Record<string, any>>(),
  employeeCount: int("employeeCount"),
  hiringVelocity: mysqlEnum("hiringVelocity", ["low", "medium", "high"]),
  
  // Tech stack
  techStack: json("techStack").$type<string[]>(),
  
  // Funding
  fundingInfo: json("fundingInfo").$type<Record<string, any>>(),
  
  confidenceScore: int("confidenceScore").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// SYSTEM TABLES
// ============================================================================

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }).notNull(),
  resourceId: int("resourceId"),
  
  changes: json("changes").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  
  errorType: varchar("errorType", { length: 255 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  context: json("context").$type<Record<string, any>>(),
  
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type ProductKnowledge = typeof productKnowledge.$inferSelect;
export type InsertProductKnowledge = typeof productKnowledge.$inferInsert;

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

export type CampaignLlmConfig = typeof campaignLlmConfig.$inferSelect;
export type InsertCampaignLlmConfig = typeof campaignLlmConfig.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = typeof communicationLogs.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type VoiceCallSession = typeof voiceCallSessions.$inferSelect;
export type InsertVoiceCallSession = typeof voiceCallSessions.$inferInsert;

export type CallScript = typeof callScripts.$inferSelect;
export type InsertCallScript = typeof callScripts.$inferInsert;

export type ScrapedData = typeof scrapedData.$inferSelect;
export type InsertScrapedData = typeof scrapedData.$inferInsert;

export type RecruitmentIntelligence = typeof recruitmentIntelligence.$inferSelect;
export type InsertRecruitmentIntelligence = typeof recruitmentIntelligence.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

// ============================================================================
// API SETTINGS TABLE
// ============================================================================

export const apiSettings = mysqlTable("api_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  section: varchar("section", { length: 100 }).notNull(), // email, twilio, vapi, etc.
  key: varchar("key", { length: 100 }).notNull(), // smtpHost, twilioAccountSid, etc.
  value: text("value").notNull(), // The actual API key or setting value
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiSetting = typeof apiSettings.$inferSelect;
export type InsertApiSetting = typeof apiSettings.$inferInsert;

// ============================================================================
// WORKFLOW AUTOMATION TABLES
// ============================================================================

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }),
  triggerType: mysqlEnum("triggerType", ["time_based", "status_change", "inactivity"]).notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, any>>().notNull(), // { days: 7, schedule: "0 9 * * *", targetStatus: "new" }
  actionType: mysqlEnum("actionType", ["send_email", "make_call", "update_status", "notify_owner"]).notNull(),
  actionConfig: json("actionConfig").$type<Record<string, any>>().notNull(), // { emailTemplate: "follow_up", newStatus: "contacted" }
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workflowExecutions = mysqlTable("workflow_executions", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  leadId: int("leadId").notNull(),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

export const callRecordings = mysqlTable("callRecordings", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(), // Who uploaded it
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileSize: int("fileSize"), // bytes
  duration: int("duration"), // seconds
  transcriptText: text("transcriptText"), // Extracted transcript
  transcriptStatus: mysqlEnum("transcriptStatus", ["pending", "processing", "completed", "failed"]).default("pending"),
  metadata: json("metadata"), // Additional data (speaker labels, timestamps, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;

export const emailVariants = mysqlTable("emailVariants", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  variantName: varchar("variantName", { length: 100 }).notNull(), // "A", "B", "C", etc.
  subjectLine: text("subjectLine").notNull(),
  emailBody: text("emailBody").notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  openedCount: int("openedCount").default(0).notNull(),
  clickedCount: int("clickedCount").default(0).notNull(),
  repliedCount: int("repliedCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailSequences = mysqlTable("emailSequences", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailSequenceSteps = mysqlTable("emailSequenceSteps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(), // 1, 2, 3, etc.
  delayDays: int("delayDays").notNull(), // Days after previous step (0 for first step)
  subjectLine: text("subjectLine").notNull(),
  emailBody: text("emailBody").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailSequenceEnrollments = mysqlTable("emailSequenceEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  leadId: int("leadId").notNull(),
  currentStep: int("currentStep").default(0).notNull(), // 0 = not started, 1 = step 1, etc.
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  completedAt: timestamp("completedAt"),
});

export type EmailVariant = typeof emailVariants.$inferSelect;
export type InsertEmailVariant = typeof emailVariants.$inferInsert;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;
export type InsertEmailSequenceStep = typeof emailSequenceSteps.$inferInsert;
export type EmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferSelect;
export type InsertEmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferInsert;


// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: int("leadId").references(() => leads.id, { onDelete: "cascade" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: mysqlEnum("taskType", ["call", "email", "meeting", "follow_up", "research", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================================================
// GDPR COMPLIANCE
// ============================================================================

export const consentRecords = mysqlTable("consentRecords", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").references(() => leads.id, { onDelete: "cascade" }),
  consentType: mysqlEnum("consentType", ["email", "phone", "sms", "data_processing"]).notNull(),
  consented: boolean("consented").notNull(),
  consentedAt: timestamp("consentedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  withdrawnAt: timestamp("withdrawnAt"),
  notes: text("notes"),
});

export const deletionRequests = mysqlTable("deletionRequests", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").references(() => leads.id, { onDelete: "set null" }),
  requestedBy: int("requestedBy").references(() => users.id),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "approved", "completed", "rejected"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy").references(() => users.id),
  reason: text("reason"),
  leadEmail: varchar("leadEmail", { length: 320 }), // Store email before deletion
  leadName: varchar("leadName", { length: 255 }), // Store name before deletion
  notes: text("notes"),
});

export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = typeof consentRecords.$inferInsert;
export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type InsertDeletionRequest = typeof deletionRequests.$inferInsert;


export const recruitmentSignals = mysqlTable("recruitmentSignals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  signalType: mysqlEnum("signalType", ["job_posting", "funding", "expansion", "leadership_change"]).notNull(),
  description: text("description").notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl"),
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).notNull().default("medium"),
  metadata: json("metadata"),
  detectedAt: timestamp("detectedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
