import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { 
  emailVariants, 
  emailSequences, 
  emailSequenceSteps, 
  emailSequenceEnrollments 
} from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

export const emailCampaignsRouter = router({
  // ============================================================================
  // A/B TESTING
  // ============================================================================
  
  // Create email variant for A/B testing
  createVariant: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      variantName: z.string(),
      subjectLine: z.string(),
      emailBody: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(emailVariants).values(input);
      return { success: true };
    }),

  // List variants for campaign
  listVariants: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(emailVariants)
        .where(eq(emailVariants.campaignId, input.campaignId));
    }),

  // Get variant performance
  getVariantStats: protectedProcedure
    .input(z.object({ variantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const variant = await db
        .select()
        .from(emailVariants)
        .where(eq(emailVariants.id, input.variantId))
        .limit(1);

      if (variant.length === 0) return null;

      const v = variant[0];
      return {
        ...v,
        openRate: v.sentCount > 0 ? (v.openedCount / v.sentCount) * 100 : 0,
        clickRate: v.sentCount > 0 ? (v.clickedCount / v.sentCount) * 100 : 0,
        replyRate: v.sentCount > 0 ? (v.repliedCount / v.sentCount) * 100 : 0,
      };
    }),

  // Update variant stats (called when email is sent/opened/clicked)
  updateVariantStats: protectedProcedure
    .input(z.object({
      variantId: z.number(),
      action: z.enum(["sent", "opened", "clicked", "replied"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const variant = await db
        .select()
        .from(emailVariants)
        .where(eq(emailVariants.id, input.variantId))
        .limit(1);

      if (variant.length === 0) throw new Error("Variant not found");

      const updates: any = {};
      if (input.action === "sent") updates.sentCount = variant[0].sentCount + 1;
      if (input.action === "opened") updates.openedCount = variant[0].openedCount + 1;
      if (input.action === "clicked") updates.clickedCount = variant[0].clickedCount + 1;
      if (input.action === "replied") updates.repliedCount = variant[0].repliedCount + 1;

      await db
        .update(emailVariants)
        .set(updates)
        .where(eq(emailVariants.id, input.variantId));

      return { success: true };
    }),

  // ============================================================================
  // EMAIL SEQUENCES (DRIP CAMPAIGNS)
  // ============================================================================

  // Create email sequence
  createSequence: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      steps: z.array(z.object({
        stepNumber: z.number(),
        delayDays: z.number(),
        subjectLine: z.string(),
        emailBody: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create sequence
      const result = await db.insert(emailSequences).values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
      });

      // Get the inserted sequence ID (workaround for insertId issue)
      const sequences = await db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.campaignId, input.campaignId))
        .orderBy(emailSequences.id);
      
      const sequenceId = sequences[sequences.length - 1].id;

      // Create steps
      for (const step of input.steps) {
        await db.insert(emailSequenceSteps).values({
          sequenceId,
          ...step,
        });
      }

      return { success: true, sequenceId };
    }),

  // List sequences for campaign
  listSequences: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.campaignId, input.campaignId));
    }),

  // Get sequence with steps
  getSequence: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sequence = await db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.id, input.sequenceId))
        .limit(1);

      if (sequence.length === 0) return null;

      const steps = await db
        .select()
        .from(emailSequenceSteps)
        .where(eq(emailSequenceSteps.sequenceId, input.sequenceId));

      return {
        ...sequence[0],
        steps,
      };
    }),

  // Enroll lead in sequence
  enrollLead: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      leadId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(emailSequenceEnrollments).values({
        sequenceId: input.sequenceId,
        leadId: input.leadId,
        currentStep: 0,
        status: "active",
      });

      return { success: true };
    }),

  // Get enrollments for sequence
  getEnrollments: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(emailSequenceEnrollments)
        .where(eq(emailSequenceEnrollments.sequenceId, input.sequenceId));
    }),

  // Process sequence (send next email in sequence)
  processSequence: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const enrollment = await db
        .select()
        .from(emailSequenceEnrollments)
        .where(eq(emailSequenceEnrollments.id, input.enrollmentId))
        .limit(1);

      if (enrollment.length === 0) throw new Error("Enrollment not found");

      const e = enrollment[0];

      // Get next step
      const nextStepNumber = e.currentStep + 1;
      const steps = await db
        .select()
        .from(emailSequenceSteps)
        .where(eq(emailSequenceSteps.sequenceId, e.sequenceId));

      const nextStep = steps.find(s => s.stepNumber === nextStepNumber);

      if (!nextStep) {
        // Sequence complete
        await db
          .update(emailSequenceEnrollments)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(emailSequenceEnrollments.id, input.enrollmentId));

        return { success: true, completed: true };
      }

      // Check if enough time has passed
      const lastSent = e.lastEmailSentAt;
      if (lastSent) {
        const daysSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < nextStep.delayDays) {
          return { success: false, reason: "Delay not met" };
        }
      }

      // TODO: Send email using email service
      // For now, just update the enrollment

      await db
        .update(emailSequenceEnrollments)
        .set({
          currentStep: nextStepNumber,
          lastEmailSentAt: new Date(),
        })
        .where(eq(emailSequenceEnrollments.id, input.enrollmentId));

      return { success: true, completed: false, stepSent: nextStepNumber };
    }),
});
