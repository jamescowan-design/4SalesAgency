import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as exportsDb from "../../db/exports";
import * as db from "../../db";
import { exportLeads, exportToCSV } from "../../services/crmExport";

export const exportsRouter = router({
  // Get export history
  list: protectedProcedure.query(async ({ ctx }) => {
    return exportsDb.getExportsByUser(ctx.user.id, 50);
  }),

  // Get export stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return exportsDb.getExportStats(ctx.user.id);
  }),

  // Export leads to CRM platform
  exportLeads: protectedProcedure
    .input(
      z.object({
        leadIds: z.array(z.number()),
        platform: z.enum(["hubspot", "salesforce", "pipedrive", "csv"]),
        fieldMapping: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create export log
      const exportId = await exportsDb.createExportLog({
        userId: ctx.user.id,
        platform: input.platform,
        exportType: input.leadIds.length === 1 ? "single" : "bulk",
        leadIds: input.leadIds,
        status: "pending",
        recordsExported: 0,
      });

      try {
        // Fetch leads
        const leads = await Promise.all(
          input.leadIds.map((id) => db.getLeadById(id))
        );
        const validLeads = leads.filter((lead): lead is NonNullable<typeof lead> => lead !== null && lead !== undefined);

        if (validLeads.length === 0) {
          await exportsDb.updateExportStatus(
            exportId,
            "failed",
            0,
            "No valid leads found"
          );
          return { success: false, recordsExported: 0, error: "No valid leads found" };
        }

        // Get API keys from settings - query settings directly from database
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { apiSettings } = await import("../../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { decrypt } = await import("../../services/encryption");
        
        let apiKey: string | undefined;
        let instanceUrl: string | undefined;

        if (input.platform === "hubspot") {
          const settings = await dbConn.select().from(apiSettings).where(eq(apiSettings.userId, ctx.user.id));
          const hubspotSetting = settings.find(s => s.key === "hubspotApiKey");
          apiKey = hubspotSetting ? decrypt(hubspotSetting.value) : undefined;
        } else if (input.platform === "salesforce") {
          const settings = await dbConn.select().from(apiSettings).where(eq(apiSettings.userId, ctx.user.id));
          const apiKeySetting = settings.find(s => s.key === "salesforceApiKey");
          const instanceSetting = settings.find(s => s.key === "salesforceInstanceUrl");
          apiKey = apiKeySetting ? decrypt(apiKeySetting.value) : undefined;
          instanceUrl = instanceSetting ? decrypt(instanceSetting.value) : undefined;
        } else if (input.platform === "pipedrive") {
          const settings = await dbConn.select().from(apiSettings).where(eq(apiSettings.userId, ctx.user.id));
          const pipedriveSetting = settings.find(s => s.key === "pipedriveApiKey");
          apiKey = pipedriveSetting ? decrypt(pipedriveSetting.value) : undefined;
        }

        // For CSV, return the CSV content directly
        if (input.platform === "csv") {
          const csvContent = exportToCSV(validLeads, input.fieldMapping as Record<string, string> | undefined);
          await exportsDb.updateExportStatus(
            exportId,
            "success",
            validLeads.length
          );
          return {
            success: true,
            recordsExported: validLeads.length,
            csvContent,
          };
        }

        // Export to CRM platform
        const result = await exportLeads(validLeads, {
          platform: input.platform,
          apiKey,
          instanceUrl,
          fieldMapping: input.fieldMapping as Record<string, string> | undefined,
        });

        // Update export log
        await exportsDb.updateExportStatus(
          exportId,
          result.success ? "success" : "failed",
          result.recordsExported,
          result.errorMessage
        );

        return result;
      } catch (error: any) {
        await exportsDb.updateExportStatus(
          exportId,
          "failed",
          0,
          error.message
        );
        return {
          success: false,
          recordsExported: 0,
          errorMessage: error.message,
          csvContent: undefined,
        };
      }
    }),

  // Test CRM connection
  testConnection: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["hubspot", "salesforce", "pipedrive"]),
        apiKey: z.string(),
        instanceUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.platform === "hubspot") {
          const response = await fetch(
            "https://api.hubapi.com/crm/v3/objects/contacts?limit=1",
            {
              headers: {
                Authorization: `Bearer ${input.apiKey}`,
              },
            }
          );
          return { success: response.ok };
        } else if (input.platform === "salesforce") {
          if (!input.instanceUrl) {
            return { success: false, error: "Instance URL is required" };
          }
          const response = await fetch(
            `${input.instanceUrl}/services/data/v57.0/sobjects/Contact/describe`,
            {
              headers: {
                Authorization: `Bearer ${input.apiKey}`,
              },
            }
          );
          return { success: response.ok };
        } else if (input.platform === "pipedrive") {
          const response = await fetch(
            `https://api.pipedrive.com/v1/users/me?api_token=${input.apiKey}`
          );
          return { success: response.ok };
        }
        return { success: false, error: "Unsupported platform" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),
});
