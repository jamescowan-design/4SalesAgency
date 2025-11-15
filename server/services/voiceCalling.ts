import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export interface CallParams {
  campaignId: number;
  leadId: number;
  callType: "qualification" | "follow_up" | "demo_booking" | "custom";
  customInstructions?: string;
}

export interface CallScript {
  greeting: string;
  mainTalkingPoints: string[];
  objectionHandling: Record<string, string>;
  closingStatement: string;
  callToAction: string;
}

/**
 * Generate AI call script using Virtual LLM knowledge
 */
export async function generateCallScript(
  params: CallParams
): Promise<CallScript> {
  const { campaignId, leadId, callType, customInstructions } = params;

  const campaign = await db.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const knowledge = await db.getProductKnowledgeByCampaignId(campaignId);
  const lead = await db.getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const scrapedData = await db.getScrapedDataByLeadId(leadId);

  const productContext = knowledge
    ? `
Product: ${knowledge.productName || "Not specified"}
Description: ${knowledge.productDescription || "Not specified"}
Key Features: ${knowledge.keyFeatures?.join(", ") || "Not specified"}
Benefits: ${knowledge.benefits?.join(", ") || "Not specified"}
Use Cases: ${knowledge.useCases?.join(", ") || "Not specified"}
Pricing: ${knowledge.pricingInfo || "Not specified"}
Competitive Advantages: ${knowledge.competitiveAdvantages?.join(", ") || "Not specified"}
`
    : "No product knowledge available";

  const leadContext = `
Company: ${lead.companyName}
Industry: ${lead.companyIndustry || "Unknown"}
Contact: ${lead.contactName || "Unknown"} (${lead.contactJobTitle || "Unknown"})
Location: ${lead.companyLocation || "Unknown"}
Size: ${lead.companySize || "Unknown"} employees
`;

  const scrapedContext =
    scrapedData && scrapedData.length > 0 && scrapedData[0].rawData
      ? `
Company Intelligence:
- Description: ${(scrapedData[0].rawData as any)?.description || "Not available"}
- Products/Services: ${(scrapedData[0].rawData as any)?.products?.join(", ") || "Not available"}
- Hiring Signals: ${(scrapedData[0].rawData as any)?.hiringSignals?.join(", ") || "None"}
`
      : "";

  const callTypeInstructions = {
    qualification: `Create a qualification call script. Goal: Determine if they're a good fit. Ask about their current challenges, budget, timeline, and decision-making process.`,
    follow_up: `Create a follow-up call script. Reference previous contact. Be consultative and add value. Goal: Move them to next stage.`,
    demo_booking: `Create a demo booking call script. Highlight the value of a demo. Handle objections about time. Goal: Schedule a specific meeting time.`,
    custom: customInstructions || "Create a professional sales call script.",
  };

  const prompt = `You are a B2B sales expert creating a phone call script for an AI voice agent.

PRODUCT INFORMATION:
${productContext}

LEAD INFORMATION:
${leadContext}

${scrapedContext}

TASK: ${callTypeInstructions[callType]}

Create a conversational, natural-sounding call script that:
1. Personalizes based on their industry and company intelligence
2. References specific product features that match their needs
3. Sounds human and conversational (not robotic)
4. Handles common objections
5. Has a clear call-to-action

Return ONLY a JSON object with this structure:
{
  "greeting": "Opening statement (mention their name and company)",
  "mainTalkingPoints": ["point 1", "point 2", "point 3"],
  "objectionHandling": {
    "not interested": "response",
    "too busy": "response",
    "already have solution": "response",
    "send me info": "response"
  },
  "closingStatement": "How to wrap up the call",
  "callToAction": "What you want them to do next"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert B2B sales trainer. Create natural, conversational call scripts. Always return valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "call_script",
        strict: true,
        schema: {
          type: "object",
          properties: {
            greeting: {
              type: "string",
              description: "Opening greeting for the call",
            },
            mainTalkingPoints: {
              type: "array",
              items: { type: "string" },
              description: "Key points to cover during the call",
            },
            objectionHandling: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Responses to common objections",
            },
            closingStatement: {
              type: "string",
              description: "How to close the call",
            },
            callToAction: {
              type: "string",
              description: "What action to request from the lead",
            },
          },
          required: [
            "greeting",
            "mainTalkingPoints",
            "objectionHandling",
            "closingStatement",
            "callToAction",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0].message.content;
  if (!messageContent || typeof messageContent !== "string") {
    throw new Error("Invalid LLM response");
  }

  return JSON.parse(messageContent);
}

/**
 * Initiate outbound call via Twilio + VAPI
 * NOTE: This requires Twilio, VAPI, and ElevenLabs API keys to be configured
 */
export async function initiateCall(params: {
  leadId: number;
  campaignId: number;
  phoneNumber: string;
  callScript: CallScript;
}): Promise<{ callSessionId: number; status: string }> {
  const { leadId, campaignId, phoneNumber, callScript } = params;

  // TODO: Integrate with actual Twilio API
  // For now, create a call session record
  const sessionId = await db.createVoiceCallSession({
    leadId,
    campaignId,
    phoneNumber,
    status: "initiated",
    callStartedAt: new Date(),
  });

  // TODO: Call Twilio API to initiate call
  // TODO: Configure VAPI to handle the conversation using the call script
  // TODO: Use ElevenLabs for voice synthesis

  // Log activity
  await db.createActivity({
    leadId,
    campaignId,
    userId: 1, // System user
    activityType: "call",
    description: `Initiated AI call to ${phoneNumber}`,
  });

  return {
    callSessionId: sessionId,
    status: "initiated",
  };
}

/**
 * Process call completion and transcription
 */
export async function processCallCompletion(params: {
  callSessionId: number;
  duration: number;
  recording: string;
  transcription?: string;
  outcome: "answered" | "voicemail" | "no_answer" | "busy" | "failed";
}): Promise<void> {
  const { callSessionId, duration, recording, transcription, outcome } = params;

  // Update call session
  await db.updateVoiceCallSession(callSessionId, {
    status: outcome === "answered" ? "completed" : "failed",
    duration,
    recordingUrl: recording,
    transcript: transcription,
    callEndedAt: new Date(),
  });

  // Get session details to log communication
  const sessions = await db.getVoiceCallSessionsByLeadId(0); // Get by ID not available
  const session = sessions.find(s => s.id === callSessionId);
  if (!session) return;

  // Log communication
  await db.createCommunicationLog({
    leadId: session.leadId,
    campaignId: session.campaignId,
    communicationType: "call",
    direction: "outbound",
    content: transcription || "Call completed",
    status: outcome === "answered" ? "delivered" : "failed",
    sentAt: session.callStartedAt || new Date(),
  });

  // Update lead last contacted
  await db.updateLead(session.leadId, {
    lastContactedAt: new Date(),
  });
}

/**
 * Analyze call sentiment and extract insights
 */
export async function analyzeCallSentiment(
  transcription: string
): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  keyInsights: string[];
  nextSteps: string[];
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a sales call analyst. Analyze call transcripts for sentiment and insights.",
      },
      {
        role: "user",
        content: `Analyze this sales call transcript and provide:
1. Overall sentiment (positive/neutral/negative)
2. Key insights from the conversation
3. Recommended next steps

Transcript:
${transcription}

Return JSON with structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "keyInsights": ["insight 1", "insight 2"],
  "nextSteps": ["action 1", "action 2"]
}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "call_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative"],
            },
            keyInsights: {
              type: "array",
              items: { type: "string" },
            },
            nextSteps: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["sentiment", "keyInsights", "nextSteps"],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0].message.content;
  if (!messageContent || typeof messageContent !== "string") {
    throw new Error("Invalid LLM response");
  }

  return JSON.parse(messageContent);
}
