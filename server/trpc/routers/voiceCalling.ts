import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import * as twilioService from "../../services/twilioService";
import * as vapiService from "../../services/vapiService";
import * as elevenLabsService from "../../services/elevenLabsService";
import * as assemblyAIService from "../../services/assemblyAIService";

/**
 * Voice Calling Router
 * Integrates Twilio, VAPI, ElevenLabs, and AssemblyAI
 * All API keys are managed through Settings page
 */

export const voiceCallingRouter = router({
  // ============================================================================
  // TWILIO - Direct Phone Calls
  // ============================================================================

  initiateCall: protectedProcedure
    .input(
      z.object({
        toNumber: z.string(),
        callbackUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return twilioService.initiateCall({
        userId: ctx.user.id,
        toNumber: input.toNumber,
        callbackUrl: input.callbackUrl,
      });
    }),

  getCallStatus: protectedProcedure
    .input(z.object({ callSid: z.string() }))
    .query(async ({ input, ctx }) => {
      return twilioService.getCallStatus({
        userId: ctx.user.id,
        callSid: input.callSid,
      });
    }),

  endCall: protectedProcedure
    .input(z.object({ callSid: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return twilioService.endCall({
        userId: ctx.user.id,
        callSid: input.callSid,
      });
    }),

  sendSMS: protectedProcedure
    .input(
      z.object({
        toNumber: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return twilioService.sendSMS({
        userId: ctx.user.id,
        toNumber: input.toNumber,
        message: input.message,
      });
    }),

  // ============================================================================
  // VAPI - AI-Powered Conversations
  // ============================================================================

  startVAPICall: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        assistantId: z.string().optional(),
        callScript: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return vapiService.startVAPICall({
        userId: ctx.user.id,
        phoneNumber: input.phoneNumber,
        assistantId: input.assistantId,
        callScript: input.callScript,
      });
    }),

  getVAPICallStatus: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ input, ctx }) => {
      return vapiService.getVAPICallStatus({
        userId: ctx.user.id,
        callId: input.callId,
      });
    }),

  endVAPICall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return vapiService.endVAPICall({
        userId: ctx.user.id,
        callId: input.callId,
      });
    }),

  // ============================================================================
  // ELEVENLABS - Voice Synthesis
  // ============================================================================

  synthesizeSpeech: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        voiceId: z.string().optional(),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return elevenLabsService.synthesizeSpeech({
        userId: ctx.user.id,
        text: input.text,
        voiceId: input.voiceId,
        modelId: input.modelId,
      });
    }),

  listVoices: protectedProcedure.query(async ({ ctx }) => {
    return elevenLabsService.listVoices({
      userId: ctx.user.id,
    });
  }),

  getVoiceSettings: protectedProcedure
    .input(z.object({ voiceId: z.string() }))
    .query(async ({ input, ctx }) => {
      return elevenLabsService.getVoiceSettings({
        userId: ctx.user.id,
        voiceId: input.voiceId,
      });
    }),

  // ============================================================================
  // ASSEMBLYAI - Transcription & Analysis
  // ============================================================================

  transcribeAudio: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string(),
        speakerLabels: z.boolean().optional(),
        sentimentAnalysis: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return assemblyAIService.transcribeAudio({
        userId: ctx.user.id,
        audioUrl: input.audioUrl,
        speakerLabels: input.speakerLabels,
        sentimentAnalysis: input.sentimentAnalysis,
      });
    }),

  getTranscript: protectedProcedure
    .input(z.object({ transcriptId: z.string() }))
    .query(async ({ input, ctx }) => {
      return assemblyAIService.getTranscript({
        userId: ctx.user.id,
        transcriptId: input.transcriptId,
      });
    }),

  analyzeSentiment: protectedProcedure
    .input(z.object({ transcriptId: z.string() }))
    .query(async ({ input, ctx }) => {
      return assemblyAIService.analyzeSentiment({
        userId: ctx.user.id,
        transcriptId: input.transcriptId,
      });
    }),

  searchTranscript: protectedProcedure
    .input(
      z.object({
        transcriptId: z.string(),
        keywords: z.array(z.string()),
      })
    )
    .query(async ({ input, ctx }) => {
      return assemblyAIService.searchTranscript({
        userId: ctx.user.id,
        transcriptId: input.transcriptId,
        keywords: input.keywords,
      });
    }),
});
