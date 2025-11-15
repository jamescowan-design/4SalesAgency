import * as db from "../db";

export interface PrioritizedLead {
  leadId: number;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  confidenceScore: number;
  priorityScore: number;
  reasons: string[];
  recommendedAction: string;
  urgency: "high" | "medium" | "low";
  lastContactedAt: Date | null;
  daysSinceLastContact: number;
}

/**
 * Calculate priority score for a lead
 * Combines multiple factors:
 * - Confidence score (ICP match)
 * - Engagement signals (opened emails, answered calls)
 * - Buying signals (hiring, funding, growth mentions)
 * - Recency (time since last contact)
 * - Lead temperature (hot/warm/cold)
 */
export async function calculatePriorityScore(leadId: number): Promise<{
  score: number;
  reasons: string[];
  recommendedAction: string;
  urgency: "high" | "medium" | "low";
}> {
  const lead = await db.getLeadById(leadId);
  if (!lead) {
    return { score: 0, reasons: [], recommendedAction: "Lead not found", urgency: "low" };
  }

  const communications = await db.getCommunicationLogsByLeadId(leadId);
  const activities = await db.getActivitiesByLeadId(leadId);

  let score = 0;
  const reasons: string[] = [];

  // 1. Base confidence score (0-40 points)
  const confidencePoints = (lead.confidenceScore || 0) * 0.4;
  score += confidencePoints;
  if (lead.confidenceScore && lead.confidenceScore >= 80) {
    reasons.push(`High ICP match (${lead.confidenceScore}% confidence)`);
  }

  // 2. Engagement signals (0-30 points)
  const emailOpens = communications.filter(
    (c) => c.communicationType === "email" && c.status === "opened"
  ).length;
  const emailReplies = communications.filter(
    (c) => c.communicationType === "email" && c.status === "replied"
  ).length;
  const calls = activities.filter((a) => a.activityType === "call").length;

  if (emailReplies > 0) {
    score += 30;
    reasons.push(`Replied to ${emailReplies} email(s)`);
  } else if (emailOpens > 0) {
    score += 15;
    reasons.push(`Opened ${emailOpens} email(s)`);
  }

  if (calls > 0) {
    score += 10;
    reasons.push(`${calls} call(s) made`);
  }

  // 3. Buying signals from scraped data (0-20 points)
  const scrapedData = await db.getScrapedDataByLeadId(leadId);
  if (scrapedData.length > 0) {
    const latestScrape = scrapedData[0];
    const hiringSignals = (latestScrape.processedData?.hiringSignals as string[]) || [];

    if (hiringSignals.length > 0) {
      score += 20;
      reasons.push(`${hiringSignals.length} hiring signal(s) detected`);
    }

    // Check for growth indicators
    const content = JSON.stringify(latestScrape.rawData || {}).toLowerCase();
    if (
      content.includes("funding") ||
      content.includes("series") ||
      content.includes("investment")
    ) {
      score += 10;
      reasons.push("Recent funding mentioned");
    }

    if (content.includes("expanding") || content.includes("growth")) {
      score += 5;
      reasons.push("Company growth mentioned");
    }
  }

  // 4. Recency factor (0-10 points, negative if too recent or too old)
  const daysSinceLastContact = lead.lastContactedAt
    ? (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysSinceLastContact < 1) {
    // Too recent, reduce priority
    score -= 10;
    reasons.push("Contacted very recently (give them space)");
  } else if (daysSinceLastContact >= 3 && daysSinceLastContact <= 7) {
    // Optimal follow-up window
    score += 10;
    reasons.push("Optimal follow-up timing (3-7 days)");
  } else if (daysSinceLastContact > 14) {
    // Getting cold
    score += 5;
    reasons.push(`No contact in ${Math.floor(daysSinceLastContact)} days (re-engage)`);
  }

  // 5. Status-based adjustments
  if (lead.status === "responded") {
    score += 15;
    reasons.push("Lead has responded (warm)");
  } else if (lead.status === "qualified") {
    score += 20;
    reasons.push("Lead is qualified (hot)");
  } else if (lead.status === "unqualified" || lead.status === "rejected") {
    score = 0;
    reasons.push("Lead is unqualified or rejected");
  }

  // Determine urgency
  let urgency: "high" | "medium" | "low" = "low";
  if (score >= 70) {
    urgency = "high";
  } else if (score >= 40) {
    urgency = "medium";
  }

  // Recommended action
  let recommendedAction = "Review lead";
  if (emailReplies > 0 && calls === 0) {
    recommendedAction = "Make a phone call (they're engaged)";
  } else if (emailOpens > 0 && emailReplies === 0 && daysSinceLastContact >= 3) {
    recommendedAction = "Send follow-up email";
  } else if (daysSinceLastContact > 14) {
    recommendedAction = "Re-engage with new approach";
  } else if (lead.status === "new") {
    recommendedAction = "Send initial outreach email";
  } else if (lead.status === "qualified") {
    recommendedAction = "Schedule demo or meeting";
  }

  return {
    score: Math.max(0, Math.min(100, score)), // Clamp to 0-100
    reasons,
    recommendedAction,
    urgency,
  };
}

/**
 * Get prioritized leads for a campaign
 */
export async function getPrioritizedLeads(
  campaignId: number,
  limit: number = 20
): Promise<PrioritizedLead[]> {
  const leads = await db.getLeadsByCampaignId(campaignId);

  // Filter out unqualified/rejected leads
  const activeLeads = leads.filter(
    (l) => l.status !== "unqualified" && l.status !== "rejected" && l.status !== "converted"
  );

  const prioritized: PrioritizedLead[] = [];

  for (const lead of activeLeads) {
    const priority = await calculatePriorityScore(lead.id);

    const daysSinceLastContact = lead.lastContactedAt
      ? (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    prioritized.push({
      leadId: lead.id,
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      status: lead.status,
      confidenceScore: lead.confidenceScore || 0,
      priorityScore: priority.score,
      reasons: priority.reasons,
      recommendedAction: priority.recommendedAction,
      urgency: priority.urgency,
      lastContactedAt: lead.lastContactedAt,
      daysSinceLastContact,
    });
  }

  // Sort by priority score descending
  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

  return prioritized.slice(0, limit);
}

/**
 * Get daily top leads recommendation
 */
export async function getDailyTopLeads(
  campaignId: number
): Promise<{
  date: Date;
  topLeads: PrioritizedLead[];
  summary: {
    totalActive: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    needsFollowUp: number;
    needsReEngagement: number;
  };
}> {
  const allPrioritized = await getPrioritizedLeads(campaignId, 100);

  const summary = {
    totalActive: allPrioritized.length,
    highPriority: allPrioritized.filter((l) => l.urgency === "high").length,
    mediumPriority: allPrioritized.filter((l) => l.urgency === "medium").length,
    lowPriority: allPrioritized.filter((l) => l.urgency === "low").length,
    needsFollowUp: allPrioritized.filter((l) =>
      l.recommendedAction.toLowerCase().includes("follow-up")
    ).length,
    needsReEngagement: allPrioritized.filter((l) =>
      l.recommendedAction.toLowerCase().includes("re-engage")
    ).length,
  };

  return {
    date: new Date(),
    topLeads: allPrioritized.slice(0, 10),
    summary,
  };
}

/**
 * Get leads that need immediate attention
 */
export async function getUrgentLeads(
  campaignId: number
): Promise<PrioritizedLead[]> {
  const prioritized = await getPrioritizedLeads(campaignId, 100);

  // Filter for high urgency or specific conditions
  return prioritized.filter(
    (lead) =>
      lead.urgency === "high" ||
      lead.daysSinceLastContact > 14 ||
      lead.status === "responded"
  );
}

/**
 * Get leads grouped by recommended action
 */
export async function getLeadsByAction(
  campaignId: number
): Promise<Record<string, PrioritizedLead[]>> {
  const prioritized = await getPrioritizedLeads(campaignId, 100);

  const grouped: Record<string, PrioritizedLead[]> = {};

  for (const lead of prioritized) {
    const action = lead.recommendedAction;
    if (!grouped[action]) {
      grouped[action] = [];
    }
    grouped[action].push(lead);
  }

  return grouped;
}
