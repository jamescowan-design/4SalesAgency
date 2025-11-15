import cron from 'node-cron';
import * as db from '../db';

interface WorkflowRule {
  id: number;
  campaignId: number;
  triggerType: 'time_based' | 'status_change' | 'inactivity';
  triggerConfig: any;
  actionType: 'send_email' | 'make_call' | 'update_status' | 'notify_owner';
  actionConfig: any;
  isActive: boolean;
}

// Store active cron jobs
const activeJobs = new Map<number, cron.ScheduledTask>();

/**
 * Initialize workflow automation system
 */
export function initWorkflowAutomation() {
  console.log('[Workflow] Initializing workflow automation system...');
  
  // Run every hour to check for workflows that need execution
  cron.schedule('0 * * * *', async () => {
    console.log('[Workflow] Running hourly workflow check...');
    await checkAndExecuteWorkflows();
  });
  
  // Run daily at 9 AM to check for follow-ups
  cron.schedule('0 9 * * *', async () => {
    console.log('[Workflow] Running daily follow-up check...');
    await checkFollowUps();
  });
}

/**
 * Check and execute workflows based on rules
 */
async function checkAndExecuteWorkflows() {
  try {
    const workflows = await db.getActiveWorkflows();
    
    for (const workflow of workflows) {
      await executeWorkflow(workflow);
    }
  } catch (error) {
    console.error('[Workflow] Error checking workflows:', error);
  }
}

/**
 * Execute a specific workflow
 */
async function executeWorkflow(workflow: WorkflowRule) {
  try {
    const leads = await db.getLeadsByCampaignId(workflow.campaignId);
    
    for (const lead of leads) {
      // Check if workflow should trigger for this lead
      const shouldTrigger = await checkTriggerCondition(workflow, lead);
      
      if (shouldTrigger) {
        await executeAction(workflow, lead);
      }
    }
  } catch (error) {
    console.error(`[Workflow] Error executing workflow ${workflow.id}:`, error);
  }
}

/**
 * Check if workflow trigger condition is met
 */
async function checkTriggerCondition(workflow: WorkflowRule, lead: any): Promise<boolean> {
  switch (workflow.triggerType) {
    case 'inactivity':
      return await checkInactivityTrigger(workflow, lead);
    
    case 'status_change':
      return checkStatusChangeTrigger(workflow, lead);
    
    case 'time_based':
      return checkTimeBasedTrigger(workflow, lead);
    
    default:
      return false;
  }
}

/**
 * Check inactivity trigger (no contact in X days)
 */
async function checkInactivityTrigger(workflow: WorkflowRule, lead: any): Promise<boolean> {
  const { days } = workflow.triggerConfig;
  const activities = await db.getActivitiesByLeadId(lead.id);
  
  if (activities.length === 0) {
    // No activities yet - check lead creation date
    const daysSinceCreation = Math.floor(
      (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation >= days;
  }
  
  // Check last activity
  const lastActivity = activities.sort((a, b) => 
    (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
  )[0];
  
  if (!lastActivity.completedAt) return false;
  
  const daysSinceLastActivity = Math.floor(
    (Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceLastActivity >= days;
}

/**
 * Check status change trigger
 */
function checkStatusChangeTrigger(workflow: WorkflowRule, lead: any): boolean {
  const { targetStatus } = workflow.triggerConfig;
  return lead.status === targetStatus;
}

/**
 * Check time-based trigger
 */
function checkTimeBasedTrigger(workflow: WorkflowRule, lead: any): boolean {
  // Time-based triggers are handled by cron schedule
  return true;
}

/**
 * Execute workflow action
 */
async function executeAction(workflow: WorkflowRule, lead: any) {
  console.log(`[Workflow] Executing ${workflow.actionType} for lead ${lead.id}`);
  
  switch (workflow.actionType) {
    case 'send_email':
      await executeSendEmailAction(workflow, lead);
      break;
    
    case 'make_call':
      await executeMakeCallAction(workflow, lead);
      break;
    
    case 'update_status':
      await executeUpdateStatusAction(workflow, lead);
      break;
    
    case 'notify_owner':
      await executeNotifyOwnerAction(workflow, lead);
      break;
  }
}

/**
 * Send email action
 */
async function executeSendEmailAction(workflow: WorkflowRule, lead: any) {
  // This would integrate with the email sending service
  console.log(`[Workflow] Would send email to ${lead.contactEmail}`);
  
  // Create activity record
  await db.createActivity({
    campaignId: workflow.campaignId,
    leadId: lead.id,
    activityType: 'email',
    status: 'scheduled',
    notes: 'Automated workflow email',
  });
}

/**
 * Make call action
 */
async function executeMakeCallAction(workflow: WorkflowRule, lead: any) {
  console.log(`[Workflow] Would make call to ${lead.contactPhone}`);
  
  // Create activity record
  await db.createActivity({
    campaignId: workflow.campaignId,
    leadId: lead.id,
    activityType: 'call',
    status: 'scheduled',
    notes: 'Automated workflow call',
  });
}

/**
 * Update status action
 */
async function executeUpdateStatusAction(workflow: WorkflowRule, lead: any) {
  const { newStatus } = workflow.actionConfig;
  await db.updateLeadStatus(lead.id, newStatus);
  console.log(`[Workflow] Updated lead ${lead.id} status to ${newStatus}`);
}

/**
 * Notify owner action
 */
async function executeNotifyOwnerAction(workflow: WorkflowRule, lead: any) {
  console.log(`[Workflow] Would notify owner about lead ${lead.id}`);
  // This would integrate with the notification service
}

/**
 * Check for follow-ups needed
 */
async function checkFollowUps() {
  try {
    // Get all leads that need follow-up
    const allLeads = await db.getAllLeads();
    
    for (const lead of allLeads) {
      const activities = await db.getActivitiesByLeadId(lead.id);
      
      if (activities.length === 0) continue;
      
      const lastActivity = activities.sort((a, b) => 
        (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      
      if (!lastActivity.completedAt) continue;
      
      const daysSinceLastActivity = Math.floor(
        (Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If no contact in 7 days and lead is active
      if (daysSinceLastActivity >= 7 && 
          lead.status !== 'converted' && 
          lead.status !== 'rejected') {
        console.log(`[Workflow] Lead ${lead.id} needs follow-up (${daysSinceLastActivity} days)`);
      }
    }
  } catch (error) {
    console.error('[Workflow] Error checking follow-ups:', error);
  }
}

/**
 * Create a new workflow rule
 */
export async function createWorkflowRule(rule: Omit<WorkflowRule, 'id'>) {
  const id = await db.createWorkflow(rule);
  
  // If time-based, set up cron job
  if (rule.triggerType === 'time_based' && rule.triggerConfig.schedule) {
    setupCronJob(id, rule);
  }
  
  return id;
}

/**
 * Setup cron job for time-based workflow
 */
function setupCronJob(workflowId: number, rule: WorkflowRule) {
  const { schedule } = rule.triggerConfig;
  
  if (!cron.validate(schedule)) {
    console.error(`[Workflow] Invalid cron schedule: ${schedule}`);
    return;
  }
  
  const task = cron.schedule(schedule, async () => {
    console.log(`[Workflow] Running scheduled workflow ${workflowId}`);
    await executeWorkflow(rule);
  });
  
  activeJobs.set(workflowId, task);
}

/**
 * Stop a workflow
 */
export function stopWorkflow(workflowId: number) {
  const task = activeJobs.get(workflowId);
  if (task) {
    task.stop();
    activeJobs.delete(workflowId);
  }
}

/**
 * Get workflow statistics
 */
export async function getWorkflowStats(campaignId: number) {
  const workflows = await db.getWorkflowsByCampaignId(campaignId);
  const executions = await db.getWorkflowExecutions(campaignId);
  
  return {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.isActive).length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.status === 'success').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
  };
}
