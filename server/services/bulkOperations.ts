import * as db from "../db";

export interface CSVLeadRow {
  companyName: string;
  companyWebsite?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyIndustry?: string;
  companyLocation?: string;
  companySize?: number;
  notes?: string;
}

export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  leadIds: number[];
}

/**
 * Parse CSV content and import leads
 */
export async function importLeadsFromCSV(
  campaignId: number,
  csvContent: string
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: false,
    totalRows: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    leadIds: [],
  };

  try {
    // Simple CSV parsing (assumes comma-separated, first row is headers)
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      result.errors.push({ row: 0, error: "CSV file is empty or has no data rows" });
      return result;
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Validate required columns
    if (!headers.includes("companyname") && !headers.includes("company_name")) {
      result.errors.push({
        row: 0,
        error: "CSV must have a 'companyName' or 'company_name' column",
      });
      return result;
    }

    result.totalRows = lines.length - 1;

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length !== headers.length) {
        result.errors.push({
          row: rowNum,
          error: `Column count mismatch (expected ${headers.length}, got ${values.length})`,
        });
        result.skipped++;
        continue;
      }

      // Build row object
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });

      // Extract lead data
      const companyName =
        row.companyname || row.company_name || row["company name"];
      if (!companyName) {
        result.errors.push({ row: rowNum, error: "Missing company name" });
        result.skipped++;
        continue;
      }

      try {
        // Create lead
        const leadId = await db.createLead({
          campaignId,
          companyName,
          companyWebsite: row.companywebsite || row.company_website || row.website || null,
          contactName: row.contactname || row.contact_name || row.name || null,
          contactEmail: row.contactemail || row.contact_email || row.email || null,
          contactPhone: row.contactphone || row.contact_phone || row.phone || null,
          companyIndustry: row.industry || row.companyindustry || null,
          companyLocation: row.location || row.companylocation || null,
          companySize: row.companysize || row.company_size
            ? parseInt(row.companysize || row.company_size, 10)
            : null,
          notes: row.notes || null,
          status: "new",
        });

        result.leadIds.push(leadId);
        result.imported++;
      } catch (error) {
        result.errors.push({
          row: rowNum,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.skipped++;
      }
    }

    result.success = result.imported > 0;
    return result;
  } catch (error) {
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return result;
  }
}

/**
 * Bulk enrich leads (scrape and analyze)
 */
export interface BulkEnrichResult {
  success: boolean;
  totalLeads: number;
  enriched: number;
  failed: number;
  errors: Array<{ leadId: number; error: string }>;
}

export async function bulkEnrichLeads(
  leadIds: number[]
): Promise<BulkEnrichResult> {
  const result: BulkEnrichResult = {
    success: false,
    totalLeads: leadIds.length,
    enriched: 0,
    failed: 0,
    errors: [],
  };

  const { enrichCompanyData } = await import("./webScraper");

  for (const leadId of leadIds) {
    try {
      const lead = await db.getLeadById(leadId);
      if (!lead) {
        result.errors.push({ leadId, error: "Lead not found" });
        result.failed++;
        continue;
      }

      // Enrich using company name or website
      const identifier = lead.companyWebsite || lead.companyName;
      // Get campaign to access ICP criteria
      const campaign = await db.getCampaignById(lead.campaignId);
      const icp: any = {
        industries: campaign?.targetIndustries || [],
        geographies: campaign?.targetGeographies || [],
      };
      
      const enrichedData = await enrichCompanyData(identifier, icp);
      
      // Update lead with enriched data
      await db.updateLead(leadId, {
        companyWebsite: enrichedData.website || lead.companyWebsite,
        companyIndustry: enrichedData.industry || lead.companyIndustry,
        companyLocation: enrichedData.location || lead.companyLocation,
        companySize: enrichedData.employeeCount || lead.companySize,
        contactEmail: enrichedData.contactEmail || lead.contactEmail,
        contactPhone: enrichedData.contactPhone || lead.contactPhone,
        confidenceScore: enrichedData.confidence,
      });
      
      // Store scraped data
      await db.createScrapedData({
        leadId,
        sourceUrl: enrichedData.website || identifier,
        dataType: "company_info",
        rawData: enrichedData as any,
        processedData: {
          products: enrichedData.products,
          services: enrichedData.services,
          hiringSignals: enrichedData.hiringSignals,
        },
        scrapedAt: new Date(),
      });

      result.enriched++;
    } catch (error) {
      result.errors.push({
        leadId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      result.failed++;
    }
  }

  result.success = result.enriched > 0;
  return result;
}

/**
 * Bulk send emails
 */
export interface BulkEmailResult {
  success: boolean;
  totalLeads: number;
  sent: number;
  failed: number;
  errors: Array<{ leadId: number; error: string }>;
}

export async function bulkSendEmails(
  leadIds: number[],
  emailType: "initial_outreach" | "follow_up" | "meeting_request" | "custom",
  customContent?: string
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = {
    success: false,
    totalLeads: leadIds.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const { generateEmail } = await import("./emailGenerator");

  for (const leadId of leadIds) {
    try {
      const lead = await db.getLeadById(leadId);
      if (!lead) {
        result.errors.push({ leadId, error: "Lead not found" });
        result.failed++;
        continue;
      }

      if (!lead.contactEmail) {
        result.errors.push({ leadId, error: "No email address" });
        result.failed++;
        continue;
      }

      // Generate email
      const email = await generateEmail({
        leadId,
        campaignId: lead.campaignId,
        emailType,
      });

      // TODO: Actually send email via SMTP/SendGrid
      // For now, just log it

      // Create communication log
      await db.createCommunicationLog({
        leadId,
        campaignId: lead.campaignId,
        communicationType: "email",
        direction: "outbound",
        subject: email.subject,
        content: email.body,
        status: "sent",
        sentAt: new Date(),
      });

      // Create activity
      await db.createActivity({
        leadId,
        campaignId: lead.campaignId,
        userId: 1, // System user
        activityType: "email",
        description: `Bulk sent ${emailType} email`,
      });

      result.sent++;
    } catch (error) {
      result.errors.push({
        leadId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      result.failed++;
    }
  }

  result.success = result.sent > 0;
  return result;
}

/**
 * Bulk update lead status
 */
export interface BulkUpdateResult {
  success: boolean;
  totalLeads: number;
  updated: number;
  failed: number;
  errors: Array<{ leadId: number; error: string }>;
}

export async function bulkUpdateStatus(
  leadIds: number[],
  newStatus: string
): Promise<BulkUpdateResult> {
  const result: BulkUpdateResult = {
    success: false,
    totalLeads: leadIds.length,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const leadId of leadIds) {
    try {
      await db.updateLead(leadId, {
        status: newStatus as any,
      });

      result.updated++;
    } catch (error) {
      result.errors.push({
        leadId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      result.failed++;
    }
  }

  result.success = result.updated > 0;
  return result;
}

/**
 * Export leads to CSV
 */
export async function exportLeadsToCSV(campaignId: number): Promise<string> {
  const leads = await db.getLeadsByCampaignId(campaignId);

  // Build CSV
  const headers = [
    "ID",
    "Company Name",
    "Company Website",
    "Contact Name",
    "Contact Email",
    "Contact Phone",
    "Industry",
    "Location",
    "Size",
    "Revenue",
    "Status",
    "Confidence Score",
    "Last Contacted",
    "Created At",
    "Notes",
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.companyName,
    lead.companyWebsite || "",
    lead.contactName || "",
    lead.contactEmail || "",
    lead.contactPhone || "",
    lead.companyIndustry || "",
    lead.companyLocation || "",
    lead.companySize || "",
    lead.companyRevenue || "",
    lead.status,
    lead.confidenceScore || "",
    lead.lastContactedAt?.toISOString() || "",
    lead.createdAt.toISOString(),
    lead.notes || "",
  ]);

  const csvLines = [headers.join(",")];
  for (const row of rows) {
    // Escape commas and quotes in values
    const escapedRow = row.map((val) => {
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvLines.push(escapedRow.join(","));
  }

  return csvLines.join("\n");
}
