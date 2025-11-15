import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export interface EmailGenerationParams {
  campaignId: number;
  leadId: number;
  emailType: "initial_outreach" | "follow_up" | "meeting_request" | "custom";
  customInstructions?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  tone: string;
  mergeFields: Record<string, string>;
}

/**
 * Generate personalized email using Virtual LLM knowledge
 */
export async function generateEmail(
  params: EmailGenerationParams
): Promise<GeneratedEmail> {
  const { campaignId, leadId, emailType, customInstructions } = params;

  // Get campaign and product knowledge
  const campaign = await db.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const knowledge = await db.getProductKnowledgeByCampaignId(campaignId);
  const lead = await db.getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  // Get scraped data for additional context
  const scrapedData = await db.getScrapedDataByLeadId(leadId);

  // Build context for LLM
  const productContext = knowledge
    ? `
Product Name: ${knowledge.productName || "Not specified"}
Description: ${knowledge.productDescription || "Not specified"}
Key Features: ${knowledge.keyFeatures?.join(", ") || "Not specified"}
Benefits: ${knowledge.benefits?.join(", ") || "Not specified"}
Use Cases: ${knowledge.useCases?.join(", ") || "Not specified"}
Pricing: ${knowledge.pricingInfo || "Not specified"}
Competitive Advantages: ${knowledge.competitiveAdvantages?.join(", ") || "Not specified"}
`
    : "No product knowledge available";

  const leadContext = `
Company Name: ${lead.companyName}
Industry: ${lead.companyIndustry || "Unknown"}
Location: ${lead.companyLocation || "Unknown"}
Company Size: ${lead.companySize || "Unknown"} employees
Contact Name: ${lead.contactName || "Unknown"}
Contact Title: ${lead.contactJobTitle || "Unknown"}
`;

  const scrapedContext = scrapedData && scrapedData.length > 0 && scrapedData[0].rawData
    ? `
Company Description: ${(scrapedData[0].rawData as any)?.description || "Not available"}
Products/Services: ${(scrapedData[0].rawData as any)?.products?.join(", ") || "Not available"}
Hiring Signals: ${(scrapedData[0].rawData as any)?.hiringSignals?.join(", ") || "None detected"}
`
    : "";

  const emailTypeInstructions = {
    initial_outreach: `Write an initial cold outreach email. Be professional, concise, and focus on how the product solves their specific pain points. Include a clear call-to-action.`,
    follow_up: `Write a follow-up email for someone who hasn't responded. Be polite, add value, and reference the previous email. Keep it short.`,
    meeting_request: `Write an email requesting a meeting or demo. Highlight the value they'll get from the meeting. Suggest specific times.`,
    custom: customInstructions || "Write a professional business email.",
  };

  const prompt = `You are a B2B sales expert writing a personalized email.

PRODUCT INFORMATION:
${productContext}

LEAD INFORMATION:
${leadContext}

${scrapedContext ? `COMPANY INTELLIGENCE:\n${scrapedContext}` : ""}

TASK: ${emailTypeInstructions[emailType]}

REQUIREMENTS:
1. Personalize based on the company's industry, size, and any scraped intelligence
2. Reference specific product features that match their needs
3. Keep it under 150 words
4. Professional but conversational tone
5. Include merge fields in double curly braces like {{companyName}}, {{contactName}}, {{contactTitle}}
6. Do NOT use placeholder text - use real information from the context above

Return ONLY a JSON object with this exact structure:
{
  "subject": "email subject line",
  "body": "email body with merge fields",
  "tone": "professional/friendly/consultative"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert B2B sales email writer. Always return valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body with merge fields in {{field}} format",
            },
            tone: {
              type: "string",
              enum: ["professional", "friendly", "consultative"],
              description: "Tone of the email",
            },
          },
          required: ["subject", "body", "tone"],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0].message.content;
  if (!messageContent || typeof messageContent !== "string") {
    throw new Error("Invalid LLM response");
  }

  const generated = JSON.parse(messageContent);

  // Extract merge fields from the body
  const mergeFields: Record<string, string> = {
    companyName: lead.companyName,
    contactName: lead.contactName || "there",
    contactTitle: lead.contactJobTitle || "",
    companyIndustry: lead.companyIndustry || "",
    companyLocation: lead.companyLocation || "",
    productName: knowledge?.productName || "",
  };

  return {
    subject: generated.subject,
    body: generated.body,
    tone: generated.tone,
    mergeFields,
  };
}

/**
 * Replace merge fields in email content
 */
export function replaceMergeFields(
  content: string,
  mergeFields: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(mergeFields)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Validate email content before sending
 */
export function validateEmail(email: GeneratedEmail): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!email.subject || email.subject.trim().length === 0) {
    errors.push("Subject line is required");
  }

  if (!email.body || email.body.trim().length === 0) {
    errors.push("Email body is required");
  }

  if (email.body && email.body.length > 5000) {
    errors.push("Email body is too long (max 5000 characters)");
  }

  // Check for unreplaced merge fields
  const unreplacedFields = email.body.match(/{{([^}]+)}}/g);
  if (unreplacedFields) {
    errors.push(`Unreplaced merge fields: ${unreplacedFields.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
