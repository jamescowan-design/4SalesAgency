import { getDb } from "../db";
import { apiSettings, communicationLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  trackingId?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get API settings for a user
 */
async function getUserSettings(userId: number): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const settings = await db
    .select()
    .from(apiSettings)
    .where(eq(apiSettings.userId, userId));

  const settingsMap: Record<string, string> = {};
  settings.forEach(setting => {
    settingsMap[setting.key] = setting.value;
  });

  return settingsMap;
}

/**
 * Send email using SendGrid API
 */
async function sendViaSendGrid(
  apiKey: string,
  options: EmailOptions
): Promise<SendEmailResult> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
          subject: options.subject,
        }],
        from: {
          email: options.from || "noreply@yourdomain.com",
          name: options.fromName || "4 Sales Agency",
        },
        content: [
          {
            type: "text/html",
            value: options.html,
          },
          ...(options.text ? [{
            type: "text/plain",
            value: options.text,
          }] : []),
        ],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
        },
        custom_args: options.trackingId ? {
          tracking_id: options.trackingId,
        } : undefined,
      }),
    });

    if (response.ok) {
      const messageId = response.headers.get("x-message-id") || "unknown";
      return { success: true, messageId };
    } else {
      const error = await response.text();
      return { success: false, error: `SendGrid error: ${error}` };
    }
  } catch (error) {
    return {
      success: false,
      error: `SendGrid request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Send email using SMTP
 */
async function sendViaSMTP(
  settings: Record<string, string>,
  options: EmailOptions
): Promise<SendEmailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || "587"),
      secure: parseInt(settings.smtpPort || "587") === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Add tracking pixel if trackingId is provided
    let htmlWithTracking = options.html;
    if (options.trackingId) {
      const trackingPixel = `<img src="https://yourdomain.com/api/email/track/open/${options.trackingId}" width="1" height="1" alt="" />`;
      htmlWithTracking = options.html + trackingPixel;
    }

    const info = await transporter.sendMail({
      from: `"${options.fromName || settings.smtpFromName || "4 Sales Agency"}" <${options.from || settings.smtpFromEmail || settings.smtpUser}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: htmlWithTracking,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return {
      success: false,
      error: `SMTP error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Main email sending function
 * Automatically chooses SendGrid or SMTP based on available settings
 */
export async function sendEmail(
  userId: number,
  options: EmailOptions
): Promise<SendEmailResult> {
  const settings = await getUserSettings(userId);

  // Try SendGrid first if API key is available
  if (settings.sendgridApiKey) {
    return sendViaSendGrid(settings.sendgridApiKey, options);
  }

  // Fall back to SMTP if configured
  if (settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
    return sendViaSMTP(settings, options);
  }

  return {
    success: false,
    error: "No email service configured. Please configure SendGrid or SMTP in Settings.",
  };
}

/**
 * Send email and log to database
 */
export async function sendAndLogEmail(
  userId: number,
  leadId: number | null,
  campaignId: number,
  options: EmailOptions
): Promise<SendEmailResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate tracking ID
  const trackingId = `${campaignId}-${leadId || 0}-${Date.now()}`;
  const emailOptions = { ...options, trackingId };

  // Send email
  const result = await sendEmail(userId, emailOptions);

  // Log communication
  await db.insert(communicationLogs).values({
    campaignId,
    leadId: leadId || 0, // Use 0 if leadId is null
    communicationType: "email",
    direction: "outbound",
    subject: options.subject,
    content: options.html,
    status: result.success ? "sent" : "failed",
    metadata: {
      messageId: result.messageId,
      trackingId,
      error: result.error,
      recipient: options.to,
    } as any,
    sentAt: result.success ? new Date() : null,
  });

  return result;
}

/**
 * Track email opens
 */
export async function trackEmailOpen(trackingId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find the communication log by tracking ID
  const logs = await db
    .select()
    .from(communicationLogs)
    .limit(100); // Get recent logs and filter in JS
  
  const matchingLogs = logs.filter(log => {
    const metadata = log.metadata as Record<string, any> || {};
    return metadata.trackingId === trackingId;
  });

  if (matchingLogs.length > 0) {
    const log = matchingLogs[0];
    const metadata = (log.metadata as Record<string, any>) || {};
    metadata.opened = true;
    metadata.openedAt = new Date().toISOString();

    await db
      .update(communicationLogs)
      .set({
        metadata: metadata as any,
        openedAt: new Date(),
      })
      .where(eq(communicationLogs.id, log.id));
  }
}

/**
 * Track email clicks
 */
export async function trackEmailClick(trackingId: string, url: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find the communication log by tracking ID
  const logs = await db
    .select()
    .from(communicationLogs)
    .limit(100); // Get recent logs and filter in JS
  
  const matchingLogs = logs.filter(log => {
    const metadata = log.metadata as Record<string, any> || {};
    return metadata.trackingId === trackingId;
  });

  if (matchingLogs.length > 0) {
    const log = matchingLogs[0];
    const metadata = (log.metadata as Record<string, any>) || {};
    metadata.clicked = true;
    metadata.clickedAt = new Date().toISOString();
    metadata.clickedUrl = url;

    await db
      .update(communicationLogs)
      .set({
        metadata: metadata as any,
        clickedAt: new Date(),
      })
      .where(eq(communicationLogs.id, log.id));
  }
}
