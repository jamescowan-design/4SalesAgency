import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const createClientSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const createCampaignSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetIndustries: z.array(z.string()).optional(),
  targetGeographies: z.array(z.string()).optional(),
  companySizeMin: z.number().optional(),
  companySizeMax: z.number().optional(),
  revenueMin: z.number().optional(),
  revenueMax: z.number().optional(),
  targetJobTitles: z.array(z.string()).optional(),
  confidenceThreshold: z.number().min(0).max(100).optional(),
});

const createLeadSchema = z.object({
  campaignId: z.number(),
  companyName: z.string().min(1),
  companyWebsite: z.string().url().optional(),
  companyIndustry: z.string().optional(),
  companySize: z.number().optional(),
  companyRevenue: z.number().optional(),
  companyLocation: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactJobTitle: z.string().optional(),
  contactLinkedin: z.string().url().optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const createProductKnowledgeSchema = z.object({
  campaignId: z.number(),
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
  pricingInfo: z.string().optional(),
  targetMarket: z.string().optional(),
  competitiveAdvantages: z.array(z.string()).optional(),
  painPointsAddressed: z.array(z.string()).optional(),
  valueProposition: z.string().optional(),
  salesTalkingPoints: z.array(z.string()).optional(),
  commonObjections: z.array(z.object({
    objection: z.string(),
    response: z.string(),
  })).optional(),
});

const createActivitySchema = z.object({
  leadId: z.number().optional(),
  campaignId: z.number(),
  activityType: z.enum(["email", "call", "sms", "note", "task", "meeting"]),
  subject: z.string().optional(),
  description: z.string().optional(),
  scheduledAt: z.date().optional(),
});

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // CLIENT MANAGEMENT
  // ============================================================================
  
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getClientsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
      }),

    create: protectedProcedure
      .input(createClientSchema)
      .mutation(async ({ ctx, input }) => {
        const clientId = await db.createClient({
          ...input,
          userId: ctx.user.id,
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "create_client",
          resourceType: "client",
          resourceId: clientId,
          changes: input as any,
        });

        return { id: clientId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: createClientSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateClient(input.id, input.data);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "update_client",
          resourceType: "client",
          resourceId: input.id,
          changes: input.data as any,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClient(input.id);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "delete_client",
          resourceType: "client",
          resourceId: input.id,
          changes: {},
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================
  
  campaigns: router({
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getCampaignsByClientId(input.clientId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCampaignById(input.id);
      }),

    create: protectedProcedure
      .input(createCampaignSchema)
      .mutation(async ({ ctx, input }) => {
        const campaignId = await db.createCampaign({
          ...input,
          userId: ctx.user.id,
        });

        // Create default LLM config for campaign
        await db.createCampaignLlmConfig({
          campaignId,
          modelName: "gpt-4",
          temperature: 70,
          maxTokens: 1000,
          emailTone: "professional",
          personalizationLevel: "medium",
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "create_campaign",
          resourceType: "campaign",
          resourceId: campaignId,
          changes: input as any,
        });

        return { id: campaignId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: createCampaignSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCampaign(input.id, input.data);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "update_campaign",
          resourceType: "campaign",
          resourceId: input.id,
          changes: input.data as any,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampaign(input.id);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "delete_campaign",
          resourceType: "campaign",
          resourceId: input.id,
          changes: {},
        });

        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "active", "paused", "completed", "archived"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCampaign(input.id, { status: input.status });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "update_campaign_status",
          resourceType: "campaign",
          resourceId: input.id,
          changes: { status: input.status },
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // LEAD MANAGEMENT
  // ============================================================================
  
  leads: router({
    listByCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return db.getLeadsByCampaignId(input.campaignId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLeadById(input.id);
      }),

    create: protectedProcedure
      .input(createLeadSchema)
      .mutation(async ({ ctx, input }) => {
        const leadId = await db.createLead(input);

        // Update campaign lead count
        const campaign = await db.getCampaignById(input.campaignId);
        if (campaign) {
          await db.updateCampaign(input.campaignId, {
            leadsGenerated: (campaign.leadsGenerated || 0) + 1,
          });
        }

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "create_lead",
          resourceType: "lead",
          resourceId: leadId,
          changes: input as any,
        });

        return { id: leadId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: createLeadSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateLead(input.id, input.data);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "update_lead",
          resourceType: "lead",
          resourceId: input.id,
          changes: input.data as any,
        });

        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "responded", "qualified", "unqualified", "converted", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateLeadStatus(input.id, input.status);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "update_lead_status",
          resourceType: "lead",
          resourceId: input.id,
          changes: { status: input.status },
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteLead(input.id);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "delete_lead",
          resourceType: "lead",
          resourceId: input.id,
          changes: {},
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // PRODUCT KNOWLEDGE (Virtual LLM)
  // ============================================================================
  
  productKnowledge: router({
    getByCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return db.getProductKnowledgeByCampaignId(input.campaignId);
      }),

    createOrUpdate: protectedProcedure
      .input(createProductKnowledgeSchema)
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getProductKnowledgeByCampaignId(input.campaignId);

        if (existing) {
          await db.updateProductKnowledge(existing.id, input);
          return { id: existing.id };
        } else {
          const id = await db.createProductKnowledge(input);
          return { id };
        }
      }),

    uploadDocument: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        documentType: z.enum(["pdf", "text", "transcript", "recording", "other"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const docId = await db.createKnowledgeDocument(input);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "upload_knowledge_document",
          resourceType: "knowledge_document",
          resourceId: docId,
          changes: input as any,
        });

        return { id: docId };
      }),

    listDocuments: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return db.getKnowledgeDocumentsByCampaignId(input.campaignId);
      }),
  }),

  // ============================================================================
  // ACTIVITIES
  // ============================================================================
  
  activities: router({
    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getActivitiesByLeadId(input.leadId);
      }),

    listByCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return db.getActivitiesByCampaignId(input.campaignId);
      }),

    create: protectedProcedure
      .input(createActivitySchema)
      .mutation(async ({ ctx, input }) => {
        const activityId = await db.createActivity({
          ...input,
          userId: ctx.user.id,
        });

        return { id: activityId };
      }),
  }),

  // ============================================================================
  // COMMUNICATION LOGS
  // ============================================================================
  
  communications: router({
    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommunicationLogsByLeadId(input.leadId);
      }),

    create: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        communicationType: z.enum(["email", "call", "sms"]),
        direction: z.enum(["outbound", "inbound"]),
        subject: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const logId = await db.createCommunicationLog({
          ...input,
          sentAt: new Date(),
        });

        // Update lead last contacted
        await db.updateLead(input.leadId, {
          lastContactedAt: new Date(),
        });

        return { id: logId };
      }),
  }),

  // ============================================================================
  // VOICE CALLS
  // ============================================================================
  
  voiceCalls: router({
    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getVoiceCallSessionsByLeadId(input.leadId);
      }),

    create: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        phoneNumber: z.string(),
      }))
      .mutation(async ({ input }) => {
        const callId = await db.createVoiceCallSession({
          ...input,
          status: "initiated",
          callStartedAt: new Date(),
        });

        return { id: callId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["initiated", "ringing", "in_progress", "completed", "failed", "no_answer", "busy"]),
        duration: z.number().optional(),
        transcript: z.string().optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVoiceCallSession(id, {
          ...data,
          callEndedAt: data.status === "completed" ? new Date() : undefined,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  
  analytics: router({
    campaignStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const activities = await db.getActivitiesByCampaignId(input.campaignId);

        const leadsByStatus = leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const avgConfidenceScore = leads.length > 0
          ? leads.reduce((sum, lead) => sum + (lead.confidenceScore || 0), 0) / leads.length
          : 0;

        return {
          campaign,
          totalLeads: leads.length,
          leadsByStatus,
          totalActivities: activities.length,
          avgConfidenceScore: Math.round(avgConfidenceScore),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
