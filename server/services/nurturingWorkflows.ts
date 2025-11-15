import * as db from "../db";

export type WorkflowTrigger =
  | { type: "time_delay"; delayDays: number }
  | { type: "email_opened" }
  | { type: "email_not_opened"; waitDays: number }
  | { type: "email_replied" }
  | { type: "call_completed" }
  | { type: "call_no_answer"; waitDays: number }
  | { type: "status_change"; fromStatus: string; toStatus: string };

export type WorkflowAction =
  | { type: "send_email"; emailType: string; templateId?: number }
  | { type: "make_call"; callType: string }
  | { type: "send_sms"; message: string }
  | { type: "update_status"; newStatus: string }
  | { type: "assign_to_user"; userId: number }
  | { type: "add_tag"; tag: string }
  | { type: "create_task"; taskDescription: string };

export interface WorkflowStep {
  id: string;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  nextStepId?: string;
}

export interface NurturingWorkflow {
  id: number;
  campaignId: number;
  name: string;
  description?: string;
  isActive: boolean;
  steps: WorkflowStep[];
  createdAt: Date;
}

/**
 * Common workflow templates
 */
export const WORKFLOW_TEMPLATES = {
  coldOutreach: {
    name: "Cold Outreach Sequence",
    description: "Standard 5-touch cold outreach campaign",
    steps: [
      {
        id: "step1",
        trigger: { type: "time_delay" as const, delayDays: 0 },
        action: { type: "send_email" as const, emailType: "initial_outreach" },
        nextStepId: "step2",
      },
      {
        id: "step2",
        trigger: { type: "email_not_opened" as const, waitDays: 3 },
        action: { type: "send_email" as const, emailType: "follow_up" },
        nextStepId: "step3",
      },
      {
        id: "step3",
        trigger: { type: "email_not_opened" as const, waitDays: 4 },
        action: { type: "make_call" as const, callType: "qualification" },
        nextStepId: "step4",
      },
      {
        id: "step4",
        trigger: { type: "call_no_answer" as const, waitDays: 2 },
        action: { type: "send_email" as const, emailType: "follow_up" },
        nextStepId: "step5",
      },
      {
        id: "step5",
        trigger: { type: "email_not_opened" as const, waitDays: 7 },
        action: { type: "send_email" as const, emailType: "breakup" },
      },
    ],
  },

  warmLeadNurture: {
    name: "Warm Lead Nurture",
    description: "For leads who showed initial interest",
    steps: [
      {
        id: "step1",
        trigger: { type: "email_opened" as const },
        action: { type: "update_status" as const, newStatus: "responded" },
        nextStepId: "step2",
      },
      {
        id: "step2",
        trigger: { type: "time_delay" as const, delayDays: 1 },
        action: { type: "make_call" as const, callType: "follow_up" },
        nextStepId: "step3",
      },
      {
        id: "step3",
        trigger: { type: "call_completed" as const },
        action: { type: "send_email" as const, emailType: "meeting_request" },
      },
    ],
  },

  postDemo: {
    name: "Post-Demo Follow-up",
    description: "After a product demo has been completed",
    steps: [
      {
        id: "step1",
        trigger: { type: "time_delay" as const, delayDays: 1 },
        action: { type: "send_email" as const, emailType: "thank_you" },
        nextStepId: "step2",
      },
      {
        id: "step2",
        trigger: { type: "time_delay" as const, delayDays: 3 },
        action: { type: "make_call" as const, callType: "follow_up" },
        nextStepId: "step3",
      },
      {
        id: "step3",
        trigger: { type: "time_delay" as const, delayDays: 7 },
        action: { type: "send_email" as const, emailType: "proposal" },
      },
    ],
  },
};

/**
 * Execute a workflow step for a lead
 */
export async function executeWorkflowStep(
  leadId: number,
  campaignId: number,
  step: WorkflowStep
): Promise<{ success: boolean; nextStepId?: string; error?: string }> {
  try {
    const lead = await db.getLeadById(leadId);
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    // Execute the action
    switch (step.action.type) {
      case "send_email":
        // TODO: Integrate with email service
        await db.createCommunicationLog({
          leadId,
          campaignId,
          communicationType: "email",
          direction: "outbound",
          content: `Workflow email: ${step.action.emailType}`,
          status: "sent",
          sentAt: new Date(),
        });

        await db.createActivity({
          leadId,
          campaignId,
          userId: 1, // System user
          activityType: "email",
          description: `Workflow sent ${step.action.emailType} email`,
        });
        break;

      case "make_call":
        // TODO: Integrate with voice calling service
        await db.createActivity({
          leadId,
          campaignId,
          userId: 1,
          activityType: "call",
          description: `Workflow initiated ${step.action.callType} call`,
        });
        break;

      case "send_sms":
        // TODO: Integrate with SMS service (Twilio)
        await db.createCommunicationLog({
          leadId,
          campaignId,
          communicationType: "sms",
          direction: "outbound",
          content: step.action.message,
          status: "sent",
          sentAt: new Date(),
        });
        break;

      case "update_status":
        await db.updateLead(leadId, {
          status: step.action.newStatus as any,
        });
        break;

      case "add_tag":
        // TODO: Implement tagging system
        await db.createActivity({
          leadId,
          campaignId,
          userId: 1,
          activityType: "note",
          description: `Tagged: ${step.action.tag}`,
        });
        break;

      case "create_task":
        // TODO: Implement task system
        await db.createActivity({
          leadId,
          campaignId,
          userId: 1,
          activityType: "note",
          description: `Task created: ${step.action.taskDescription}`,
        });
        break;

      default:
        return { success: false, error: "Unknown action type" };
    }

    return {
      success: true,
      nextStepId: step.nextStepId,
    };
  } catch (error) {
    console.error("Workflow step execution failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if a trigger condition is met for a lead
 */
export async function checkTriggerCondition(
  leadId: number,
  campaignId: number,
  trigger: WorkflowTrigger,
  stepStartedAt: Date
): Promise<boolean> {
  const lead = await db.getLeadById(leadId);
  if (!lead) return false;

  const communications = await db.getCommunicationLogsByLeadId(leadId);
  const activities = await db.getActivitiesByLeadId(leadId);

  switch (trigger.type) {
    case "time_delay": {
      const daysSinceStart =
        (Date.now() - stepStartedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceStart >= trigger.delayDays;
    }

    case "email_opened": {
      const recentEmails = communications.filter(
        (c) =>
          c.communicationType === "email" &&
          c.sentAt &&
          c.sentAt >= stepStartedAt
      );
      return recentEmails.some((e) => e.status === "opened");
    }

    case "email_not_opened": {
      const recentEmails = communications.filter(
        (c) =>
          c.communicationType === "email" &&
          c.sentAt &&
          c.sentAt >= stepStartedAt
      );

      if (recentEmails.length === 0) return false;

      const latestEmail = recentEmails[recentEmails.length - 1];
      const daysSinceEmail = latestEmail.sentAt
        ? (Date.now() - latestEmail.sentAt.getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      return (
        daysSinceEmail >= trigger.waitDays &&
        latestEmail.status !== "opened" &&
        latestEmail.status !== "clicked"
      );
    }

    case "email_replied": {
      const recentEmails = communications.filter(
        (c) =>
          c.communicationType === "email" &&
          c.sentAt &&
          c.sentAt >= stepStartedAt
      );
      return recentEmails.some((e) => e.status === "replied");
    }

    case "call_completed": {
      const recentCalls = activities.filter(
        (a) =>
          a.activityType === "call" &&
          a.createdAt &&
          a.createdAt >= stepStartedAt
      );
      return recentCalls.length > 0;
    }

    case "call_no_answer": {
      const recentCalls = activities.filter(
        (a) =>
          a.activityType === "call" &&
          a.createdAt &&
          a.createdAt >= stepStartedAt
      );

      if (recentCalls.length === 0) return false;

      const latestCall = recentCalls[recentCalls.length - 1];
      const daysSinceCall =
        (Date.now() - latestCall.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      // Check if call description indicates no answer
      const noAnswer =
        latestCall.description?.toLowerCase().includes("no answer") ||
        latestCall.description?.toLowerCase().includes("voicemail");

      return daysSinceCall >= trigger.waitDays && (noAnswer || false);
    }

    case "status_change": {
      return lead.status === trigger.toStatus;
    }

    default:
      return false;
  }
}

/**
 * Process all active workflows for a campaign
 * This should be called periodically (e.g., every hour) by a cron job
 */
export async function processWorkflows(campaignId: number): Promise<{
  processed: number;
  executed: number;
  errors: number;
}> {
  const stats = { processed: 0, executed: 0, errors: 0 };

  // TODO: Get active workflows from database
  // For now, return empty stats
  return stats;
}

/**
 * Enroll a lead in a workflow
 */
export async function enrollLeadInWorkflow(
  leadId: number,
  campaignId: number,
  workflowTemplate: keyof typeof WORKFLOW_TEMPLATES
): Promise<{ success: boolean; workflowId?: number; error?: string }> {
  try {
    const template = WORKFLOW_TEMPLATES[workflowTemplate];
    if (!template) {
      return { success: false, error: "Workflow template not found" };
    }

    // TODO: Create workflow enrollment record in database
    // TODO: Schedule first step execution

    // For now, just execute the first step immediately
    const firstStep = template.steps[0];
    const result = await executeWorkflowStep(leadId, campaignId, firstStep);

    return {
      success: result.success,
      workflowId: 1, // Placeholder
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
