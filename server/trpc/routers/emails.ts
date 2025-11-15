import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { sendAndLogEmail, trackEmailOpen, trackEmailClick } from "../../services/emailSender";
import { generateEmail } from "../../services/emailGenerator";

export const emailsRouter = router({
  /**
   * Generate AI email content
   */
  generate: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        leadId: z.number(),
        emailType: z.enum(["cold_outreach", "follow_up", "demo_request", "custom"]).optional(),
        customPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = await generateEmail({
        campaignId: input.campaignId,
        leadId: input.leadId,
        emailType: input.emailType === "cold_outreach" ? "initial_outreach" : (input.emailType as any) || "initial_outreach",
        customInstructions: input.customPrompt,
      });

      return email;
    }),

  /**
   * Send email to a lead
   */
  send: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        leadId: z.number(),
        to: z.string().email(),
        subject: z.string(),
        html: z.string(),
        text: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendAndLogEmail(
        ctx.user.id,
        input.leadId,
        input.campaignId,
        {
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }
      );

      return result;
    }),

  /**
   * Send bulk emails
   */
  sendBulk: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        emails: z.array(
          z.object({
            leadId: z.number(),
            to: z.string().email(),
            subject: z.string(),
            html: z.string(),
            text: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const email of input.emails) {
        const result = await sendAndLogEmail(
          ctx.user.id,
          email.leadId,
          input.campaignId,
          {
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
          }
        );

        results.push({
          leadId: email.leadId,
          to: email.to,
          success: result.success,
          error: result.error,
        });

        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    }),

  /**
   * Track email open (called from tracking pixel)
   */
  trackOpen: protectedProcedure
    .input(z.object({ trackingId: z.string() }))
    .mutation(async ({ input }) => {
      await trackEmailOpen(input.trackingId);
      return { success: true };
    }),

  /**
   * Track email click (called from tracked links)
   */
  trackClick: protectedProcedure
    .input(
      z.object({
        trackingId: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await trackEmailClick(input.trackingId, input.url);
      return { success: true };
    }),
});
