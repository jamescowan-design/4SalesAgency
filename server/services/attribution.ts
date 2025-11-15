import * as db from "../db";

export interface TouchPoint {
  id: number;
  timestamp: Date;
  channel: "email" | "call" | "sms" | "web" | "other";
  type: string; // e.g., "initial_outreach", "follow_up", "demo"
  status: string; // e.g., "sent", "opened", "clicked", "completed"
  content?: string;
}

export interface LeadJourney {
  leadId: number;
  leadName: string;
  companyName: string;
  currentStatus: string;
  confidenceScore: number;
  touchpoints: TouchPoint[];
  firstTouch: Date;
  lastTouch: Date;
  totalTouchpoints: number;
  emailTouchpoints: number;
  callTouchpoints: number;
  smsTouchpoints: number;
  daysSinceFirstTouch: number;
  conversionPath?: string; // e.g., "Email → Call → Email → Qualified"
}

/**
 * Get complete lead journey with all touchpoints
 */
export async function getLeadJourney(leadId: number): Promise<LeadJourney> {
  const lead = await db.getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const communications = await db.getCommunicationLogsByLeadId(leadId);
  const activities = await db.getActivitiesByLeadId(leadId);

  // Combine communications and activities into touchpoints
  const touchpoints: TouchPoint[] = [];

  // Add communication logs
  for (const comm of communications) {
    touchpoints.push({
      id: comm.id,
      timestamp: comm.sentAt || comm.createdAt,
      channel: comm.communicationType as any,
      type: comm.direction === "outbound" ? "outreach" : "response",
      status: comm.status || "unknown",
      content: comm.content || undefined,
    });
  }

  // Add activities
  for (const activity of activities) {
    touchpoints.push({
      id: activity.id,
      timestamp: activity.createdAt,
      channel: activity.activityType === "call" ? "call" : "other",
      type: activity.activityType,
      status: "completed",
      content: activity.description || undefined,
    });
  }

  // Sort by timestamp
  touchpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate stats
  const firstTouch = touchpoints.length > 0 ? touchpoints[0].timestamp : lead.createdAt;
  const lastTouch = touchpoints.length > 0 ? touchpoints[touchpoints.length - 1].timestamp : lead.createdAt;
  const daysSinceFirstTouch = (Date.now() - firstTouch.getTime()) / (1000 * 60 * 60 * 24);

  const emailTouchpoints = touchpoints.filter((t) => t.channel === "email").length;
  const callTouchpoints = touchpoints.filter((t) => t.channel === "call").length;
  const smsTouchpoints = touchpoints.filter((t) => t.channel === "sms").length;

  // Build conversion path
  const pathSteps: string[] = [];
  for (const tp of touchpoints) {
    const step = `${tp.channel.charAt(0).toUpperCase() + tp.channel.slice(1)}`;
    if (pathSteps.length === 0 || pathSteps[pathSteps.length - 1] !== step) {
      pathSteps.push(step);
    }
  }
  pathSteps.push(lead.status.charAt(0).toUpperCase() + lead.status.slice(1));

  return {
    leadId: lead.id,
    leadName: lead.contactName || "Unknown",
    companyName: lead.companyName,
    currentStatus: lead.status,
    confidenceScore: lead.confidenceScore || 0,
    touchpoints,
    firstTouch,
    lastTouch,
    totalTouchpoints: touchpoints.length,
    emailTouchpoints,
    callTouchpoints,
    smsTouchpoints,
    daysSinceFirstTouch,
    conversionPath: pathSteps.join(" → "),
  };
}

/**
 * Get attribution model for a campaign
 */
export interface AttributionModel {
  model: "first_touch" | "last_touch" | "multi_touch" | "time_decay";
  channelCredits: Record<string, number>;
}

export async function calculateAttribution(
  campaignId: number,
  model: "first_touch" | "last_touch" | "multi_touch" | "time_decay" = "multi_touch"
): Promise<AttributionModel> {
  const leads = await db.getLeadsByCampaignId(campaignId);
  const convertedLeads = leads.filter(
    (l) => l.status === "qualified" || l.status === "converted"
  );

  const credits: Record<string, number> = {
    email: 0,
    call: 0,
    sms: 0,
    other: 0,
  };

  for (const lead of convertedLeads) {
    const journey = await getLeadJourney(lead.id);

    switch (model) {
      case "first_touch": {
        // All credit to first touchpoint
        const first = journey.touchpoints[0];
        if (first) {
          credits[first.channel] = (credits[first.channel] || 0) + 1;
        }
        break;
      }

      case "last_touch": {
        // All credit to last touchpoint
        const last = journey.touchpoints[journey.touchpoints.length - 1];
        if (last) {
          credits[last.channel] = (credits[last.channel] || 0) + 1;
        }
        break;
      }

      case "multi_touch": {
        // Equal credit to all touchpoints
        const creditPerTouch = 1 / journey.touchpoints.length;
        for (const tp of journey.touchpoints) {
          credits[tp.channel] = (credits[tp.channel] || 0) + creditPerTouch;
        }
        break;
      }

      case "time_decay": {
        // More credit to recent touchpoints
        const totalWeight = journey.touchpoints.reduce(
          (sum, _, idx) => sum + idx + 1,
          0
        );
        journey.touchpoints.forEach((tp, idx) => {
          const weight = (idx + 1) / totalWeight;
          credits[tp.channel] = (credits[tp.channel] || 0) + weight;
        });
        break;
      }
    }
  }

  return {
    model,
    channelCredits: credits,
  };
}

/**
 * Get channel performance metrics
 */
export interface ChannelPerformance {
  channel: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
  avgTimeToResponse: number; // in hours
}

export async function getChannelPerformance(
  campaignId: number
): Promise<ChannelPerformance[]> {
  const leads = await db.getLeadsByCampaignId(campaignId);
  const allCommunications: any[] = [];

  for (const lead of leads) {
    const comms = await db.getCommunicationLogsByLeadId(lead.id);
    allCommunications.push(...comms);
  }

  const channels = ["email", "call", "sms"];
  const performance: ChannelPerformance[] = [];

  for (const channel of channels) {
    const channelComms = allCommunications.filter(
      (c) => c.communicationType === channel
    );

    const totalSent = channelComms.length;
    const totalOpened = channelComms.filter((c) => c.status === "opened").length;
    const totalClicked = channelComms.filter((c) => c.status === "clicked").length;
    const totalReplied = channelComms.filter((c) => c.status === "replied").length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Calculate conversion rate (leads that converted after this channel)
    const convertedLeads = leads.filter(
      (l) => l.status === "qualified" || l.status === "converted"
    );
    const convertedWithChannel = convertedLeads.filter((lead) => {
      const leadComms = channelComms.filter((c) => c.leadId === lead.id);
      return leadComms.length > 0;
    });
    const conversionRate =
      totalSent > 0 ? (convertedWithChannel.length / totalSent) * 100 : 0;

    // Calculate avg time to response
    const responseTimes: number[] = [];
    for (const comm of channelComms.filter((c) => c.status === "replied")) {
      if (comm.sentAt && comm.createdAt) {
        const hours =
          (comm.createdAt.getTime() - comm.sentAt.getTime()) / (1000 * 60 * 60);
        responseTimes.push(hours);
      }
    }
    const avgTimeToResponse =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    performance.push({
      channel,
      totalSent,
      totalOpened,
      totalClicked,
      totalReplied,
      openRate,
      clickRate,
      replyRate,
      conversionRate,
      avgTimeToResponse,
    });
  }

  return performance;
}

/**
 * Get conversion funnel for a campaign
 */
export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export async function getConversionFunnel(
  campaignId: number
): Promise<ConversionFunnel[]> {
  const leads = await db.getLeadsByCampaignId(campaignId);
  const total = leads.length;

  const stages = [
    { stage: "Total Leads", status: null },
    { stage: "Contacted", status: "contacted" },
    { stage: "Responded", status: "responded" },
    { stage: "Qualified", status: "qualified" },
    { stage: "Converted", status: "converted" },
  ];

  const funnel: ConversionFunnel[] = [];
  let previousCount = total;

  for (const { stage, status } of stages) {
    const count = status === null ? total : leads.filter((l) => l.status === status).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const dropoff = previousCount - count;

    funnel.push({
      stage,
      count,
      percentage,
      dropoff,
    });

    previousCount = count;
  }

  return funnel;
}

/**
 * Get best performing conversion paths
 */
export interface ConversionPath {
  path: string;
  count: number;
  avgDaysToConvert: number;
  conversionRate: number;
}

export async function getTopConversionPaths(
  campaignId: number,
  limit: number = 10
): Promise<ConversionPath[]> {
  const leads = await db.getLeadsByCampaignId(campaignId);
  const convertedLeads = leads.filter(
    (l) => l.status === "qualified" || l.status === "converted"
  );

  const pathStats = new Map<string, { count: number; totalDays: number }>();

  for (const lead of convertedLeads) {
    const journey = await getLeadJourney(lead.id);
    const path = journey.conversionPath || "Unknown";

    const existing = pathStats.get(path) || { count: 0, totalDays: 0 };
    pathStats.set(path, {
      count: existing.count + 1,
      totalDays: existing.totalDays + journey.daysSinceFirstTouch,
    });
  }

  const paths: ConversionPath[] = [];
  for (const [path, stats] of Array.from(pathStats.entries())) {
    paths.push({
      path,
      count: stats.count,
      avgDaysToConvert: stats.totalDays / stats.count,
      conversionRate: (stats.count / leads.length) * 100,
    });
  }

  // Sort by count descending
  paths.sort((a, b) => b.count - a.count);

  return paths.slice(0, limit);
}
