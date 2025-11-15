import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { callRecordings } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../../storage";

export const callRecordingsRouter = router({
  // List recordings for a campaign
  listByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(callRecordings)
        .where(eq(callRecordings.campaignId, input.campaignId));
    }),

  // Upload call recording
  upload: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded audio
        fileSize: z.number().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `call-recordings/${ctx.user.id}/${input.campaignId}/${Date.now()}-${input.fileName}`;
      
      const { url } = await storagePut(
        fileKey,
        buffer,
        "audio/mpeg" // Adjust based on actual file type
      );

      // Insert record
      await db.insert(callRecordings).values({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        fileName: input.fileName,
        fileUrl: url,
        fileSize: input.fileSize || buffer.length,
        duration: input.duration,
        transcriptStatus: "pending",
      });

      return {
        success: true,
        url,
      };
    }),

  // Process transcript (trigger transcription)
  processTranscript: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get recording
      const recording = await db
        .select()
        .from(callRecordings)
        .where(eq(callRecordings.id, input.recordingId))
        .limit(1);

      if (recording.length === 0) {
        throw new Error("Recording not found");
      }

      // Update status to processing
      await db
        .update(callRecordings)
        .set({ transcriptStatus: "processing" })
        .where(eq(callRecordings.id, input.recordingId));

      // TODO: Integrate with AssemblyAI or other transcription service
      // For now, simulate processing
      // In production, this would:
      // 1. Download audio from S3
      // 2. Send to transcription API
      // 3. Wait for webhook or poll for results
      // 4. Update transcript text and status

      // Simulated transcript (replace with real API call)
      setTimeout(async () => {
        await db
          .update(callRecordings)
          .set({
            transcriptText: "Simulated transcript text. Replace with real transcription service.",
            transcriptStatus: "completed",
          })
          .where(eq(callRecordings.id, input.recordingId));
      }, 2000);

      return {
        success: true,
        status: "processing",
      };
    }),

  // Get recording by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(callRecordings)
        .where(eq(callRecordings.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Delete recording
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // TODO: Also delete from S3
      await db
        .delete(callRecordings)
        .where(eq(callRecordings.id, input.id));

      return { success: true };
    }),
});
