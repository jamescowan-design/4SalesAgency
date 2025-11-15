import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { adminProcedure } from "../../_core/adminProcedure";
import { getDb } from "../../db";
import { apiSettings } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const settings = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.userId, ctx.user.id));

    const settingsMap: Record<string, string> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    return settingsMap;
  }),

  save: protectedProcedure
    .input(
      z.object({
        section: z.string(),
        data: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Save each key-value pair
      for (const [key, value] of Object.entries(input.data)) {
        if (!value) continue; // Skip empty values

        // Check if setting exists
      const existing = await db
        .select()
        .from(apiSettings)
        .where(and(eq(apiSettings.userId, ctx.user.id), eq(apiSettings.key, key)))
        .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(apiSettings)
            .set({ value })
            .where(eq(apiSettings.id, existing[0].id));
        } else {
          // Insert new
          await db.insert(apiSettings).values({
            userId: ctx.user.id,
            key,
            value,
            section: input.section,
          });
        }
      }

      return { success: true };
    }),

  testConnection: protectedProcedure
    .input(
      z.object({
        service: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get settings for the service
      const settings = await db
        .select()
        .from(apiSettings)
        .where(eq(apiSettings.userId, ctx.user.id));

      const settingsMap: Record<string, string> = {};
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });

      // Test connection based on service
      if (input.service === "email") {
        // Test SMTP or SendGrid
        if (settingsMap.sendgridApiKey) {
          // Test SendGrid
          try {
            const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
              headers: {
                Authorization: `Bearer ${settingsMap.sendgridApiKey}`,
              },
            });
            if (response.ok) {
              return { success: true, message: "SendGrid connection successful" };
            } else {
              return { success: false, message: "SendGrid API key is invalid" };
            }
          } catch (error) {
            return { success: false, message: "Failed to connect to SendGrid" };
          }
        } else if (settingsMap.smtpHost && settingsMap.smtpUser && settingsMap.smtpPassword) {
          // For SMTP, we'll just validate that credentials are present
          return { success: true, message: "SMTP credentials saved (connection test requires actual email send)" };
        } else {
          return { success: false, message: "Email settings incomplete" };
        }
      } else if (input.service === "twilio") {
        // Test Twilio
        if (!settingsMap.twilioAccountSid || !settingsMap.twilioAuthToken) {
          return { success: false, message: "Twilio credentials incomplete" };
        }
        try {
          const auth = Buffer.from(`${settingsMap.twilioAccountSid}:${settingsMap.twilioAuthToken}`).toString("base64");
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${settingsMap.twilioAccountSid}.json`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            }
          );
          if (response.ok) {
            return { success: true, message: "Twilio connection successful" };
          } else {
            return { success: false, message: "Twilio credentials are invalid" };
          }
        } catch (error) {
          return { success: false, message: "Failed to connect to Twilio" };
        }
      } else if (input.service === "vapi") {
        // Test VAPI
        if (!settingsMap.vapiApiKey) {
          return { success: false, message: "VAPI API key not set" };
        }
        try {
          const response = await fetch("https://api.vapi.ai/assistant", {
            headers: {
              Authorization: `Bearer ${settingsMap.vapiApiKey}`,
            },
          });
          if (response.ok || response.status === 401) {
            // 401 means API key format is correct but might be invalid
            const isValid = response.ok;
            return {
              success: isValid,
              message: isValid ? "VAPI connection successful" : "VAPI API key is invalid",
            };
          } else {
            return { success: false, message: "Failed to connect to VAPI" };
          }
        } catch (error) {
          return { success: false, message: "Failed to connect to VAPI" };
        }
      } else if (input.service === "elevenlabs") {
        // Test ElevenLabs
        if (!settingsMap.elevenlabsApiKey) {
          return { success: false, message: "ElevenLabs API key not set" };
        }
        try {
          const response = await fetch("https://api.elevenlabs.io/v1/user", {
            headers: {
              "xi-api-key": settingsMap.elevenlabsApiKey,
            },
          });
          if (response.ok) {
            return { success: true, message: "ElevenLabs connection successful" };
          } else {
            return { success: false, message: "ElevenLabs API key is invalid" };
          }
        } catch (error) {
          return { success: false, message: "Failed to connect to ElevenLabs" };
        }
      } else if (input.service === "assemblyai") {
        // Test AssemblyAI
        if (!settingsMap.assemblyaiApiKey) {
          return { success: false, message: "AssemblyAI API key not set" };
        }
        try {
          const response = await fetch("https://api.assemblyai.com/v2/transcript", {
            headers: {
              authorization: settingsMap.assemblyaiApiKey,
            },
          });
          if (response.ok || response.status === 400) {
            // 400 is expected without a proper request body, but it means auth worked
            return { success: true, message: "AssemblyAI connection successful" };
          } else if (response.status === 401) {
            return { success: false, message: "AssemblyAI API key is invalid" };
          } else {
            return { success: false, message: "Failed to connect to AssemblyAI" };
          }
        } catch (error) {
          return { success: false, message: "Failed to connect to AssemblyAI" };
        }
      }

      return { success: false, message: "Unknown service" };
    }),

  getByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const setting = await db
        .select()
        .from(apiSettings)
        .where(and(eq(apiSettings.userId, ctx.user.id), eq(apiSettings.key, input.key)))
        .limit(1);

      return setting.length > 0 ? setting[0].value : null;
    }),
});
