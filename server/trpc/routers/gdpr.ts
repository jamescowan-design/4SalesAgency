import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { 
  leads, 
  activities, 
  communicationLogs, 
  consentRecords, 
  deletionRequests 
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const gdprRouter = router({
  // Get all personal data for a lead (data export)
  exportLeadData: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get lead data
      const leadData = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      
      // Get activities
      const activitiesData = await db.select().from(activities).where(eq(activities.leadId, input.leadId));
      
      // Get communications
      const communicationsData = await db.select().from(communicationLogs).where(eq(communicationLogs.leadId, input.leadId));
      
      // Get consent records
      const consentsData = await db.select().from(consentRecords).where(eq(consentRecords.leadId, input.leadId));

      return {
        lead: leadData[0] || null,
        activities: activitiesData,
        communications: communicationsData,
        consents: consentsData,
        exportedAt: new Date(),
      };
    }),

  // Record consent
  recordConsent: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      consentType: z.enum(["email", "phone", "sms", "data_processing"]),
      consented: z.boolean(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(consentRecords).values({
        leadId: input.leadId,
        consentType: input.consentType,
        consented: input.consented,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        notes: input.notes,
      });

      return { success: true };
    }),

  // Withdraw consent
  withdrawConsent: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      consentType: z.enum(["email", "phone", "sms", "data_processing"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find the most recent consent record
      const existingConsents = await db
        .select()
        .from(consentRecords)
        .where(
          and(
            eq(consentRecords.leadId, input.leadId),
            eq(consentRecords.consentType, input.consentType)
          )
        );

      if (existingConsents.length > 0) {
        // Update the most recent one
        const latestConsent = existingConsents.sort((a, b) => 
          b.consentedAt.getTime() - a.consentedAt.getTime()
        )[0];

        await db
          .update(consentRecords)
          .set({ 
            consented: false,
            withdrawnAt: new Date(),
          })
          .where(eq(consentRecords.id, latestConsent.id));
      }

      return { success: true };
    }),

  // Get consent status for a lead
  getConsentStatus: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const consents = await db
        .select()
        .from(consentRecords)
        .where(eq(consentRecords.leadId, input.leadId));

      // Get the latest consent for each type
      const consentStatus = {
        email: false,
        phone: false,
        sms: false,
        data_processing: false,
      };

      for (const type of Object.keys(consentStatus)) {
        const typeConsents = consents
          .filter(c => c.consentType === type)
          .sort((a, b) => b.consentedAt.getTime() - a.consentedAt.getTime());
        
        if (typeConsents.length > 0) {
          consentStatus[type as keyof typeof consentStatus] = typeConsents[0].consented;
        }
      }

      return consentStatus;
    }),

  // Request data deletion (Right to be Forgotten)
  requestDeletion: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get lead info before deletion request
      const leadData = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      const lead = leadData[0];

      if (!lead) {
        throw new Error("Lead not found");
      }

      await db.insert(deletionRequests).values({
        leadId: input.leadId,
        requestedBy: ctx.user.id,
        reason: input.reason,
        leadEmail: lead.contactEmail,
        leadName: lead.contactName,
        status: "pending",
      });

      return { 
        success: true,
      };
    }),

  // List deletion requests (admin only)
  listDeletionRequests: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "completed", "rejected"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(deletionRequests);

      if (input.status) {
        query = query.where(eq(deletionRequests.status, input.status)) as any;
      }

      const requests = await query;
      return requests;
    }),

  // Process deletion request (admin only)
  processDeletionRequest: adminProcedure
    .input(z.object({
      requestId: z.number(),
      action: z.enum(["approve", "reject", "complete"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const requestData = await db
        .select()
        .from(deletionRequests)
        .where(eq(deletionRequests.id, input.requestId))
        .limit(1);

      const request = requestData[0];
      if (!request) {
        throw new Error("Deletion request not found");
      }

      if (input.action === "approve") {
        await db
          .update(deletionRequests)
          .set({
            status: "approved",
            processedBy: ctx.user.id,
            processedAt: new Date(),
            notes: input.notes,
          })
          .where(eq(deletionRequests.id, input.requestId));
      } else if (input.action === "reject") {
        await db
          .update(deletionRequests)
          .set({
            status: "rejected",
            processedBy: ctx.user.id,
            processedAt: new Date(),
            notes: input.notes,
          })
          .where(eq(deletionRequests.id, input.requestId));
      } else if (input.action === "complete") {
        // Anonymize/delete the lead data
        if (request.leadId) {
          await db
            .update(leads)
            .set({
              contactName: "[DELETED]",
              contactEmail: null,
              contactPhone: null,
              contactLinkedin: null,
              companyWebsite: null,
              notes: "[Data deleted per GDPR request]",
            })
            .where(eq(leads.id, request.leadId));

          // Mark deletion request as completed
          await db
            .update(deletionRequests)
            .set({
              status: "completed",
              processedBy: ctx.user.id,
              processedAt: new Date(),
              notes: input.notes,
            })
            .where(eq(deletionRequests.id, input.requestId));
        }
      }

      return { success: true };
    }),

  // Get GDPR compliance summary
  getComplianceSummary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allLeads = await db.select().from(leads);
      const allConsents = await db.select().from(consentRecords);
      const allDeletionRequests = await db.select().from(deletionRequests);

      const leadsWithConsent = new Set(allConsents.map(c => c.leadId));
      const pendingDeletions = allDeletionRequests.filter(r => r.status === "pending").length;

      return {
        totalLeads: allLeads.length,
        leadsWithConsent: leadsWithConsent.size,
        leadsWithoutConsent: allLeads.length - leadsWithConsent.size,
        pendingDeletionRequests: pendingDeletions,
        completedDeletions: allDeletionRequests.filter(r => r.status === "completed").length,
        consentByType: {
          email: allConsents.filter(c => c.consentType === "email" && c.consented).length,
          phone: allConsents.filter(c => c.consentType === "phone" && c.consented).length,
          sms: allConsents.filter(c => c.consentType === "sms" && c.consented).length,
          data_processing: allConsents.filter(c => c.consentType === "data_processing" && c.consented).length,
        },
      };
    }),
});
