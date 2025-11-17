import axios from "axios";
import type { Lead } from "../../drizzle/schema";

export interface ExportConfig {
  platform: "hubspot" | "salesforce" | "pipedrive" | "csv";
  apiKey?: string;
  instanceUrl?: string; // For Salesforce
  fieldMapping?: Record<string, string>;
}

export interface ExportResult {
  success: boolean;
  recordsExported: number;
  csvContent?: string;
  error?: string;
  errorMessage?: string;
}

/**
 * Export leads to HubSpot CRM
 */
export async function exportToHubSpot(
  leads: Lead[],
  apiKey: string,
  fieldMapping?: Record<string, string>
): Promise<ExportResult> {
  try {
    const contacts = leads.map((lead) => ({
      properties: {
        email: lead.contactEmail || "",
        firstname: lead.contactName?.split(" ")[0] || "",
        lastname: lead.contactName?.split(" ").slice(1).join(" ") || "",
        company: lead.companyName,
        phone: lead.contactPhone || "",
        jobtitle: lead.contactJobTitle || "",
        website: lead.companyWebsite || "",
        linkedin_url: lead.contactLinkedin || "",
        industry: lead.companyIndustry || "",
        company_size: lead.companySize?.toString() || "",
        annual_revenue: lead.companyRevenue?.toString() || "",
        location: lead.companyLocation || "",
        notes: lead.notes || "",
        // Apply custom field mapping
        ...applyFieldMapping(lead, fieldMapping),
      },
    }));

    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts/batch/create",
      { inputs: contacts },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      recordsExported: response.data.results?.length || leads.length,
    };
  } catch (error: any) {
    return {
      success: false,
      recordsExported: 0,
      errorMessage: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Export leads to Salesforce CRM
 */
export async function exportToSalesforce(
  leads: Lead[],
  apiKey: string,
  instanceUrl: string,
  fieldMapping?: Record<string, string>
): Promise<ExportResult> {
  try {
    const contacts = leads.map((lead) => ({
      FirstName: lead.contactName?.split(" ")[0] || "",
      LastName: lead.contactName?.split(" ").slice(1).join(" ") || "Unknown",
      Email: lead.contactEmail || "",
      Phone: lead.contactPhone || "",
      Title: lead.contactJobTitle || "",
      Company: lead.companyName,
      Website: lead.companyWebsite || "",
      LinkedIn__c: lead.contactLinkedin || "", // Custom field
      Industry: lead.companyIndustry || "",
      NumberOfEmployees: lead.companySize || null,
      AnnualRevenue: lead.companyRevenue || null,
      City: lead.companyLocation?.split(",")[0] || "",
      Description: lead.notes || "",
      // Apply custom field mapping
      ...applyFieldMapping(lead, fieldMapping),
    }));

    const response = await axios.post(
      `${instanceUrl}/services/data/v57.0/composite/sobjects`,
      {
        allOrNone: false,
        records: contacts.map((contact) => ({
          attributes: { type: "Contact" },
          ...contact,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const successCount = response.data.filter((r: any) => r.success).length;

    return {
      success: successCount > 0,
      recordsExported: successCount,
      errorMessage: successCount === 0 ? "All records failed to export" : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      recordsExported: 0,
      errorMessage: error.response?.data?.[0]?.message || error.message,
    };
  }
}

/**
 * Export leads to Pipedrive CRM
 */
export async function exportToPipedrive(
  leads: Lead[],
  apiKey: string,
  fieldMapping?: Record<string, string>
): Promise<ExportResult> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        // First, create or get organization
        let orgId: number | undefined;
        if (lead.companyName) {
          const orgResponse = await axios.post(
            `https://api.pipedrive.com/v1/organizations?api_token=${apiKey}`,
            {
              name: lead.companyName,
              address: lead.companyLocation || "",
            }
          );
          orgId = orgResponse.data.data?.id;
        }

        // Then create person
        const personData: any = {
          name: lead.contactName || "Unknown",
          email: lead.contactEmail ? [{ value: lead.contactEmail, primary: true }] : [],
          phone: lead.contactPhone ? [{ value: lead.contactPhone, primary: true }] : [],
          org_id: orgId,
          // Apply custom field mapping
          ...applyFieldMapping(lead, fieldMapping),
        };

        await axios.post(
          `https://api.pipedrive.com/v1/persons?api_token=${apiKey}`,
          personData
        );

        successCount++;
      } catch (error: any) {
        errors.push(error.response?.data?.error || error.message);
      }
    }

    return {
      success: successCount > 0,
      recordsExported: successCount,
      errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      recordsExported: 0,
      errorMessage: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Export leads to CSV format
 */
export function exportToCSV(leads: Lead[], fieldMapping?: Record<string, string>): string {
  const headers = [
    "Company Name",
    "Contact Name",
    "Email",
    "Phone",
    "Job Title",
    "Website",
    "LinkedIn",
    "Industry",
    "Company Size",
    "Annual Revenue",
    "Location",
    "Status",
    "Confidence Score",
    "Source URL",
    "Notes",
  ];

  const rows = leads.map((lead) => [
    lead.companyName,
    lead.contactName || "",
    lead.contactEmail || "",
    lead.contactPhone || "",
    lead.contactJobTitle || "",
    lead.companyWebsite || "",
    lead.contactLinkedin || "",
    lead.companyIndustry || "",
    lead.companySize?.toString() || "",
    lead.companyRevenue?.toString() || "",
    lead.companyLocation || "",
    lead.status,
    lead.confidenceScore?.toString() || "",
    lead.sourceUrl || "",
    lead.notes || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Apply custom field mapping to lead data
 */
function applyFieldMapping(
  lead: Lead,
  fieldMapping?: Record<string, string>
): Record<string, any> {
  if (!fieldMapping) return {};

  const mapped: Record<string, any> = {};
  for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
    const value = (lead as any)[sourceField];
    if (value !== undefined && value !== null) {
      mapped[targetField] = value;
    }
  }
  return mapped;
}

/**
 * Main export function that routes to the appropriate platform
 */
export async function exportLeads(
  leads: Lead[],
  config: ExportConfig
): Promise<ExportResult> {
  switch (config.platform) {
    case "hubspot":
      if (!config.apiKey) {
        return {
          success: false,
          recordsExported: 0,
          errorMessage: "HubSpot API key is required",
        };
      }
      return exportToHubSpot(leads, config.apiKey, config.fieldMapping);

    case "salesforce":
      if (!config.apiKey || !config.instanceUrl) {
        return {
          success: false,
          recordsExported: 0,
          errorMessage: "Salesforce API key and instance URL are required",
        };
      }
      return exportToSalesforce(
        leads,
        config.apiKey,
        config.instanceUrl,
        config.fieldMapping
      );

    case "pipedrive":
      if (!config.apiKey) {
        return {
          success: false,
          recordsExported: 0,
          errorMessage: "Pipedrive API key is required",
        };
      }
      return exportToPipedrive(leads, config.apiKey, config.fieldMapping);

    case "csv":
      // CSV export doesn't need API keys
      return {
        success: true,
        recordsExported: leads.length,
      };

    default:
      return {
        success: false,
        recordsExported: 0,
        errorMessage: "Unsupported export platform",
      };
  }
}
