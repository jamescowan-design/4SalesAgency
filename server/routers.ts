import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { settingsRouter } from "./trpc/routers/settings";
import { emailsRouter } from "./trpc/routers/emails";
import { callRecordingsRouter } from "./trpc/routers/callRecordings";
import { emailCampaignsRouter } from "./trpc/routers/emailCampaigns";
import { voiceCallingRouter } from "./trpc/routers/voiceCalling";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
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
  settings: settingsRouter,
  emails: emailsRouter,
  callRecordings: callRecordingsRouter,
  emailCampaigns: emailCampaignsRouter,
  voiceCalling: voiceCallingRouter,
  
  workflows: router({
    list: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return db.getWorkflowsByCampaignId(input.campaignId);
      }),

    create: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        triggerType: z.enum(["time_based", "status_change", "inactivity"]),
        triggerConfig: z.record(z.string(), z.any()),
        actionType: z.enum(["send_email", "make_call", "update_status", "notify_owner"]),
        actionConfig: z.record(z.string(), z.any()),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createWorkflow({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),

    toggle: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateWorkflow(input.id, { isActive: input.isActive });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteWorkflow(input.id);
        return { success: true };
      }),
  }),

  bulkOperations: router({
    importLeads: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        leads: z.array(z.object({
          companyName: z.string(),
          companyWebsite: z.string().optional(),
          companyIndustry: z.string().optional(),
          contactName: z.string().optional(),
          contactEmail: z.string().optional(),
          contactPhone: z.string().optional(),
          contactJobTitle: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        let successful = 0;
        let failed = 0;
        let duplicates = 0;

        for (const leadData of input.leads) {
          try {
            // Check for duplicates
            const existing = await db.getLeadsByCampaignId(input.campaignId);
            const isDuplicate = existing.some(
              l => l.companyName === leadData.companyName && l.contactEmail === leadData.contactEmail
            );

            if (isDuplicate) {
              duplicates++;
              continue;
            }

            // Create lead
            await db.createLead({
              campaignId: input.campaignId,
              ...leadData,
            });
            successful++;
          } catch (error) {
            failed++;
          }
        }

        return { successful, failed, duplicates };
      }),

    exportLeads: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        return { leads };
      }),

    sendBulkEmails: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        emailType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const newLeads = leads.filter(l => l.status === 'new' && l.contactEmail);

        let successful = 0;
        let failed = 0;

        // Note: In production, this should use a queue system
        for (const lead of newLeads.slice(0, 10)) { // Limit to 10 for demo
          try {
            // This would call the email generation and sending service
            // For now, just mark as contacted
            await db.updateLeadStatus(lead.id, 'contacted');
            successful++;
            // Add 1 second delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            failed++;
          }
        }

        return { successful, failed };
      }),
  }),
  
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

    getPriorityLeads: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const activities = await db.getActivitiesByCampaignId(input.campaignId);
        
        // Calculate priority scores
        const priorityLeads = leads
          .filter(lead => lead.status !== "converted" && lead.status !== "rejected")
          .map(lead => {
            // Calculate days since last contact
            const lastActivity = activities
              .filter(a => a.leadId === lead.id)
              .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0];
            
            const daysSinceContact = lastActivity?.completedAt
              ? Math.floor((Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24))
              : 999;
            
            // Calculate priority score (0-100)
            let score = lead.confidenceScore || 50;
            
            // Boost score for high confidence
            if (lead.confidenceScore && lead.confidenceScore > 80) score += 20;
            
            // Boost score if not contacted recently
            if (daysSinceContact > 7) score += 15;
            if (daysSinceContact > 14) score += 10;
            
            // Boost for new leads
            if (lead.status === "new") score += 10;
            
            // Cap at 100
            score = Math.min(100, score);
            
            // Determine urgency
            let urgency: "high" | "medium" | "low" = "low";
            if (score >= 80 || daysSinceContact > 14) urgency = "high";
            else if (score >= 60 || daysSinceContact > 7) urgency = "medium";
            
            // Determine recommended action
            let recommendedAction = "send_email";
            let reason = "High confidence lead - time to reach out";
            
            if (lead.status === "new") {
              recommendedAction = "send_email";
              reason = "New lead - send initial outreach email";
            } else if (daysSinceContact > 14) {
              recommendedAction = "make_call";
              reason = `No contact in ${daysSinceContact} days - call to re-engage`;
            } else if (daysSinceContact > 7) {
              recommendedAction = "send_email";
              reason = `Follow up needed - last contact ${daysSinceContact} days ago`;
            } else if (lead.confidenceScore && lead.confidenceScore > 85) {
              recommendedAction = "make_call";
              reason = "Very high confidence score - call to close";
            }
            
            return {
              leadId: lead.id,
              companyName: lead.companyName,
              contactName: lead.contactName,
              contactEmail: lead.contactEmail,
              contactPhone: lead.contactPhone,
              contactJobTitle: lead.contactJobTitle,
              priorityScore: Math.round(score),
              urgency,
              recommendedAction,
              reason,
              daysSinceContact,
              lastContactDate: lastActivity?.completedAt || null,
            };
          })
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, 20); // Top 20 priority leads
        
        return {
          leads: priorityLeads,
          summary: {
            totalLeads: priorityLeads.length,
            highUrgency: priorityLeads.filter(l => l.urgency === "high").length,
            mediumUrgency: priorityLeads.filter(l => l.urgency === "medium").length,
            avgScore: Math.round(
              priorityLeads.reduce((sum, l) => sum + l.priorityScore, 0) / priorityLeads.length || 0
            ),
          },
        };
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

    getCallHistory: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getVoiceCallSessionsByLeadId(input.leadId);
      }),

    initiateCall: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        callType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead || !lead.contactPhone) {
          throw new Error("Lead or phone number not found");
        }

        const callId = await db.createVoiceCallSession({
          leadId: input.leadId,
          campaignId: input.campaignId,
          phoneNumber: lead.contactPhone,
          status: "initiated",
          callStartedAt: new Date(),
        });

        return { id: callId, phoneNumber: lead.contactPhone };
      }),

    endCall: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        notes: z.string().optional(),
        outcome: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Get the most recent call session for this lead
        const sessions = await db.getVoiceCallSessionsByLeadId(input.leadId);
        const activeSession = sessions.find(s => s.status === "initiated" || s.status === "in_progress");

        if (activeSession) {
          await db.updateVoiceCallSession(activeSession.id, {
            status: "completed",
            callEndedAt: new Date(),
          });
        }

        // Create activity record
        await db.createActivity({
          campaignId: activeSession?.campaignId || 0,
          leadId: input.leadId,
          activityType: "call",
          status: "completed",
          description: input.notes,
          completedAt: new Date(),
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // WEB SCRAPER
  // ============================================================================
  
  scraper: router({
    // Start lead discovery for a campaign
    startDiscovery: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        limit: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        if (!campaign) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }

        const { discoverCompanies } = await import("./services/webScraper");
        
        const icp = {
          industries: campaign.targetIndustries || undefined,
          geographies: campaign.targetGeographies || undefined,
          companySizeMin: campaign.companySizeMin || undefined,
          companySizeMax: campaign.companySizeMax || undefined,
        };

        const result = await discoverCompanies(icp, input.limit || 50);
        
        return {
          query: result.query,
          companiesFound: result.companies.length,
        };
      }),

    // Enrich a single company
    enrichCompany: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        companyNameOrUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        if (!campaign) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }

        const { enrichCompanyData } = await import("./services/webScraper");
        
        const icp = {
          industries: campaign.targetIndustries || undefined,
          geographies: campaign.targetGeographies || undefined,
          companySizeMin: campaign.companySizeMin || undefined,
          companySizeMax: campaign.companySizeMax || undefined,
        };

        const companyData = await enrichCompanyData(input.companyNameOrUrl, icp);
        
        // Create lead in database
        const leadId = await db.createLead({
          campaignId: input.campaignId,
          companyName: companyData.name,
          companyWebsite: companyData.website,
          companyIndustry: companyData.industry,
          companyLocation: companyData.location,
          companySize: companyData.employeeCount,
          contactEmail: companyData.contactEmail,
          contactPhone: companyData.contactPhone,
          confidenceScore: companyData.confidence,
          status: "new",
        });

        // Store scraped data
        if (companyData.description || companyData.products || companyData.services) {
          await db.createScrapedData({
            leadId,
            sourceUrl: companyData.website || "",
            dataType: "company_info",
            rawData: {
              description: companyData.description,
              products: companyData.products,
              services: companyData.services,
              hiringSignals: companyData.hiringSignals,
            },
          });
        }

        // Log activity
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "enrich_company",
          resourceType: "lead",
          resourceId: leadId,
          changes: { companyData } as any,
        });

        return { leadId, companyData };
      }),
  }),

  // ============================================================================
  // EMAIL GENERATION
  // ============================================================================
  
  email: router({
    // Generate personalized email using Virtual LLM
    generate: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        leadId: z.number(),
        emailType: z.enum(["initial_outreach", "follow_up", "meeting_request", "custom"]),
        customInstructions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateEmail } = await import("./services/emailGenerator");
        const email = await generateEmail(input);
        return email;
      }),

    // Send email to lead
    send: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        subject: z.string(),
        body: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead || !lead.contactEmail) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Lead has no email address" });
        }

        // TODO: Integrate with actual email service (SendGrid/SMTP)
        // For now, just log the communication
        const logId = await db.createCommunicationLog({
          leadId: input.leadId,
          campaignId: input.campaignId,
          communicationType: "email",
          direction: "outbound",
          subject: input.subject,
          content: input.body,
          status: "sent",
          sentAt: new Date(),
        });

        // Update lead last contacted
        await db.updateLead(input.leadId, {
          lastContactedAt: new Date(),
        });

        // Log activity
        await db.createActivity({
          leadId: input.leadId,
          campaignId: input.campaignId,
          userId: ctx.user.id,
          activityType: "email",
          description: `Sent email: ${input.subject}`,
        });

        return { success: true, logId };
      }),
  }),

  // ============================================================================
  // VOICE CALLING
  // ============================================================================
  
  voice: router({
    // Generate call script
    generateScript: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        leadId: z.number(),
        callType: z.enum(["qualification", "follow_up", "demo_booking", "custom"]),
        customInstructions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateCallScript } = await import("./services/voiceCalling");
        const script = await generateCallScript(input);
        return script;
      }),

    // Initiate outbound call
    initiateCall: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        phoneNumber: z.string(),
        callScript: z.object({
          greeting: z.string(),
          mainTalkingPoints: z.array(z.string()),
          objectionHandling: z.record(z.string(), z.string()),
          closingStatement: z.string(),
          callToAction: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { initiateCall } = await import("./services/voiceCalling");
        const result = await initiateCall(input);
        return result;
      }),

    // List call sessions for a lead
    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const sessions = await db.getVoiceCallSessionsByLeadId(input.leadId);
        return sessions;
      }),

    // Get call session details
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const sessions = await db.getVoiceCallSessionsByLeadId(0);
        return sessions.find(s => s.id === input.sessionId);
      }),
  }),

  // ============================================================================
  // LEAD NURTURING WORKFLOWS
  // ============================================================================
  
  nurturingWorkflows: router({
    // Get workflow templates
    getTemplates: protectedProcedure.query(async () => {
      const { WORKFLOW_TEMPLATES } = await import("./services/nurturingWorkflows");
      return WORKFLOW_TEMPLATES;
    }),

    // Enroll lead in workflow
    enrollLead: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        campaignId: z.number(),
        workflowTemplate: z.enum(["coldOutreach", "warmLeadNurture", "postDemo"]),
      }))
      .mutation(async ({ input }) => {
        const { enrollLeadInWorkflow } = await import("./services/nurturingWorkflows");
        const result = await enrollLeadInWorkflow(
          input.leadId,
          input.campaignId,
          input.workflowTemplate
        );
        return result;
      }),

    // Process workflows (called by cron)
    processAll: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const { processWorkflows } = await import("./services/nurturingWorkflows");
        const stats = await processWorkflows(input.campaignId);
        return stats;
      }),
  }),

  // ============================================================================
  // LEAD VERIFICATION
  // ============================================================================
  
  verification: router({
    // Verify single lead
    verifyLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const { verifyLead } = await import("./services/leadVerification");
        const result = await verifyLead(input.leadId);
        return result;
      }),

    // Bulk verify leads
    bulkVerify: protectedProcedure
      .input(z.object({ leadIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const { bulkVerifyLeads } = await import("./services/leadVerification");
        const results = await bulkVerifyLeads(input.leadIds);
        return Object.fromEntries(results);
      }),

    // Get campaign verification stats
    campaignStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getCampaignVerificationStats } = await import("./services/leadVerification");
        const stats = await getCampaignVerificationStats(input.campaignId);
        return stats;
      }),
  }),

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  
  bulk: router({
    // Import leads from CSV
    importCSV: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        csvContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { importLeadsFromCSV } = await import("./services/bulkOperations");
        return await importLeadsFromCSV(input.campaignId, input.csvContent);
      }),

    // Bulk enrich leads
    enrichLeads: protectedProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { bulkEnrichLeads } = await import("./services/bulkOperations");
        return await bulkEnrichLeads(input.leadIds);
      }),

    // Bulk send emails
    sendEmails: protectedProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
        emailType: z.enum(["initial_outreach", "follow_up", "meeting_request", "custom"]),
        customContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { bulkSendEmails } = await import("./services/bulkOperations");
        return await bulkSendEmails(input.leadIds, input.emailType, input.customContent);
      }),

    // Bulk update status
    updateStatus: protectedProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
        newStatus: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { bulkUpdateStatus } = await import("./services/bulkOperations");
        return await bulkUpdateStatus(input.leadIds, input.newStatus);
      }),

    // Export leads to CSV
    exportCSV: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { exportLeadsToCSV } = await import("./services/bulkOperations");
        return await exportLeadsToCSV(input.campaignId);
      }),
  }),

  // ============================================================================
  // AI LEAD PRIORITIZATION
  // ============================================================================
  
  prioritization: router({
    // Get prioritized leads
    getPrioritized: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getPrioritizedLeads } = await import("./services/leadPrioritization");
        return await getPrioritizedLeads(input.campaignId, input.limit);
      }),

    // Get daily top leads
    dailyTop: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getDailyTopLeads } = await import("./services/leadPrioritization");
        return await getDailyTopLeads(input.campaignId);
      }),

    // Get urgent leads
    urgent: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getUrgentLeads } = await import("./services/leadPrioritization");
        return await getUrgentLeads(input.campaignId);
      }),

    // Get leads grouped by recommended action
    byAction: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getLeadsByAction } = await import("./services/leadPrioritization");
        return await getLeadsByAction(input.campaignId);
      }),

    // Calculate priority score for single lead
    calculateScore: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const { calculatePriorityScore } = await import("./services/leadPrioritization");
        return await calculatePriorityScore(input.leadId);
      }),
  }),

  // ============================================================================
  // MULTI-CHANNEL ATTRIBUTION
  // ============================================================================
  
  attribution: router({
    // Get lead journey
    leadJourney: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const { getLeadJourney } = await import("./services/attribution");
        return await getLeadJourney(input.leadId);
      }),

    // Calculate attribution model
    calculateModel: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        model: z.enum(["first_touch", "last_touch", "multi_touch", "time_decay"]).optional(),
      }))
      .query(async ({ input }) => {
        const { calculateAttribution } = await import("./services/attribution");
        return await calculateAttribution(input.campaignId, input.model);
      }),

    // Get channel performance
    channelPerformance: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getChannelPerformance } = await import("./services/attribution");
        return await getChannelPerformance(input.campaignId);
      }),

    // Get conversion funnel
    conversionFunnel: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getConversionFunnel } = await import("./services/attribution");
        return await getConversionFunnel(input.campaignId);
      }),

    // Get top conversion paths
    topPaths: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getTopConversionPaths } = await import("./services/attribution");
        return await getTopConversionPaths(input.campaignId, input.limit);
      }),
  }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  
  analytics: router({
    // Comprehensive campaign analytics
    getCampaignAnalytics: protectedProcedure
      .input(z.object({ 
        campaignId: z.number(),
        timeRange: z.enum(["7d", "30d", "90d"]).optional(),
      }))
      .query(async ({ input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const activities = await db.getActivitiesByCampaignId(input.campaignId);
        const allCommunications = await Promise.all(
          leads.map(async (lead) => await db.getCommunicationLogsByLeadId(lead.id))
        );
        const communications = allCommunications.flat();

        // Overview metrics
        const emailComms = communications.filter(c => c.communicationType === 'email');
        const emailsSent = emailComms.filter(c => c.direction === 'outbound').length;
        const emailsOpened = emailComms.filter(c => c.status === 'opened').length;
        const emailsClicked = emailComms.filter(c => c.status === 'clicked').length;
        const callActivities = activities.filter(a => a.activityType === 'call');

        // Lead status distribution
        const leadStatusDistribution = Object.entries(
          leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));

        // Activity trends (last 30 days)
        const activityTrends = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayActivities = activities.filter(a => {
            const actDate = a.createdAt.toISOString().split('T')[0];
            return actDate === dateStr;
          });
          
          activityTrends.push({
            date: dateStr,
            emails: dayActivities.filter(a => a.activityType === 'email').length,
            calls: dayActivities.filter(a => a.activityType === 'call').length,
          });
        }

        // Email performance over time
        const emailPerformance = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayEmails = emailComms.filter(c => {
            const emailDate = c.createdAt.toISOString().split('T')[0];
            return emailDate === dateStr;
          });
          
          emailPerformance.push({
            date: dateStr,
            sent: dayEmails.filter(c => c.direction === 'outbound').length,
            opened: dayEmails.filter(c => c.status === 'opened').length,
            clicked: dayEmails.filter(c => c.status === 'clicked').length,
          });
        }

        // Conversion funnel
        const conversionFunnel = [
          { stage: 'New', count: leads.filter(l => l.status === 'new').length },
          { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
          { stage: 'Responded', count: leads.filter(l => l.status === 'responded').length },
          { stage: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
          { stage: 'Converted', count: leads.filter(l => l.status === 'converted').length },
        ];

        // Top leads by engagement
        const topLeads = leads
          .map(lead => {
            const leadActivities = activities.filter(a => a.leadId === lead.id);
            const leadComms = communications.filter(c => c.leadId === lead.id);
            const score = (lead.confidenceScore || 0) + (leadActivities.length * 5) + (leadComms.length * 3);
            return {
              companyName: lead.companyName,
              contactName: lead.contactName,
              score,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        return {
          overview: {
            totalLeads: leads.length,
            qualifiedLeads: leads.filter(l => l.status === 'qualified' || l.status === 'converted').length,
            emailsSent,
            emailOpenRate: emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0,
            callsMade: callActivities.length,
            callConnectRate: 75, // Placeholder
            leadsGrowth: 12.5, // Placeholder
          },
          leadStatusDistribution,
          activityTrends,
          emailPerformance,
          conversionFunnel,
          topLeads,
        };
      }),

    // Campaign overview stats
    campaignStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const activities = await db.getActivitiesByCampaignId(input.campaignId);
        // Get all communication logs for leads in this campaign
        const allCommunications = await Promise.all(
          leads.map(async (lead) => await db.getCommunicationLogsByLeadId(lead.id))
        );
        const communications = allCommunications.flat();

        const leadsByStatus = leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const avgConfidenceScore = leads.length > 0
          ? leads.reduce((sum, lead) => sum + (lead.confidenceScore || 0), 0) / leads.length
          : 0;

        // Email metrics
        const emailComms = communications.filter(c => c.communicationType === 'email');
        const emailsSent = emailComms.filter(c => c.direction === 'outbound').length;
        const emailsOpened = emailComms.filter(c => c.status === 'opened').length;
        const emailsReplied = emailComms.filter(c => c.status === 'replied').length;

        // Call metrics
        const callActivities = activities.filter(a => a.activityType === 'call');
        const callsMade = callActivities.length;

        return {
          campaign,
          totalLeads: leads.length,
          leadsByStatus,
          totalActivities: activities.length,
          avgConfidenceScore: Math.round(avgConfidenceScore),
          emailMetrics: {
            sent: emailsSent,
            opened: emailsOpened,
            replied: emailsReplied,
            openRate: emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0,
            replyRate: emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0,
          },
          callMetrics: {
            made: callsMade,
          },
          conversionRate: leads.length > 0
            ? Math.round(((leadsByStatus.qualified || 0) / leads.length) * 100)
            : 0,
        };
      }),

    // Email performance metrics
    emailMetrics: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        // Get all communication logs for leads in this campaign
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        const allCommunications = await Promise.all(
          leads.map(async (lead) => await db.getCommunicationLogsByLeadId(lead.id))
        );
        const communications = allCommunications.flat();
        const emailComms = communications.filter((c: any) => c.communicationType === 'email');

        const sent = emailComms.filter((c: any) => c.direction === 'outbound').length;
        const opened = emailComms.filter((c: any) => c.status === 'opened').length;
        const clicked = emailComms.filter((c: any) => c.status === 'clicked').length;
        const replied = emailComms.filter((c: any) => c.status === 'replied').length;
        const bounced = emailComms.filter((c: any) => c.status === 'bounced').length;

        return {
          sent,
          opened,
          clicked,
          replied,
          bounced,
          openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
          clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
          replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
          bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
        };
      }),

    // Call performance metrics
    callMetrics: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const activities = await db.getActivitiesByCampaignId(input.campaignId);
        const calls = activities.filter(a => a.activityType === 'call');

        return {
          totalCalls: calls.length,
          // TODO: Add more call metrics when voice calling is fully integrated
        };
      }),

    // Lead source breakdown
    leadSources: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);
        // Count scraped leads (those with scraped data)
        const leadsWithScrapedData = await Promise.all(
          leads.map(async (lead) => {
            const scraped = await db.getScrapedDataByLeadId(lead.id);
            return scraped.length > 0;
          })
        );

        const webScraped = leadsWithScrapedData.filter(Boolean).length;
        const manuallyAdded = leads.length - webScraped;

        return {
          webScraped,
          manuallyAdded,
          csvImported: 0, // TODO: Track CSV imports
        };
      }),

    // Conversion funnel
    conversionFunnel: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const leads = await db.getLeadsByCampaignId(input.campaignId);

        const funnel = {
          total: leads.length,
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          responded: leads.filter(l => l.status === 'responded').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          converted: leads.filter(l => l.status === 'converted').length,
        };

        return funnel;
      }),

    // Time-based activity trends
    activityTrends: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        days: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const days = input.days || 30;
        const activities = await db.getActivitiesByCampaignId(input.campaignId);

        // Group by date
        const trends: Record<string, number> = {};
        const now = new Date();
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        activities
          .filter(a => a.createdAt >= cutoff)
          .forEach(activity => {
            const date = activity.createdAt.toISOString().split('T')[0];
            trends[date] = (trends[date] || 0) + 1;
          });

        return trends;
      }),
  }),

  // ============================================================================
  // LEAD ENRICHMENT
  // ============================================================================
  
  enrichment: router({
    // Enrich lead with web scraping
    enrichLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        // Simulate enrichment - in production, integrate with Clearbit, Hunter.io, etc.
        // For now, just mark as enriched
        await db.updateLead(input.leadId, {
          confidenceScore: Math.min((lead.confidenceScore || 0) + 10, 100),
        });

        return { success: true };
      }),

    // Enrich lead from specific URL
    enrichFromUrl: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        url: z.string(),
      }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        // Simulate enrichment from URL - in production, integrate with web scraping APIs
        const updates: any = {
          confidenceScore: Math.min((lead.confidenceScore || 0) + 15, 100),
        };
        
        if (input.url.includes('linkedin')) {
          updates.contactLinkedin = input.url;
        } else {
          updates.companyWebsite = input.url;
        }
        
        await db.updateLead(input.leadId, updates);

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
