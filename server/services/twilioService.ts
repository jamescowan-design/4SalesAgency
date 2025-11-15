import { getApiSettings } from "./apiSettingsHelper";

/**
 * Twilio Integration Service
 * Handles voice calls and SMS via Twilio API
 * API keys are stored in apiSettings table and retrieved at runtime
 */

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

async function getTwilioConfig(userId: number): Promise<TwilioConfig | null> {
  const settings = await getApiSettings(userId, "twilio");

  if (!settings.accountSid || !settings.authToken || !settings.phoneNumber) {
    return null;
  }

  return {
    accountSid: settings.accountSid,
    authToken: settings.authToken,
    phoneNumber: settings.phoneNumber,
  };
}

export async function initiateCall(params: {
  userId: number;
  toNumber: string;
  callbackUrl?: string;
}): Promise<{ success: boolean; callSid?: string; error?: string }> {
  const config = await getTwilioConfig(params.userId);

  if (!config) {
    return {
      success: false,
      error: "Twilio not configured. Please add your API keys in Settings.",
    };
  }

  try {
    // Dynamically import Twilio to avoid loading if not configured
    const twilio = await import("twilio");
    const client = twilio.default(config.accountSid, config.authToken);

    const call = await client.calls.create({
      to: params.toNumber,
      from: config.phoneNumber,
      url: params.callbackUrl || "http://demo.twilio.com/docs/voice.xml", // Default TwiML
    });

    return {
      success: true,
      callSid: call.sid,
    };
  } catch (error: any) {
    console.error("Twilio call error:", error);
    return {
      success: false,
      error: error.message || "Failed to initiate call",
    };
  }
}

export async function sendSMS(params: {
  userId: number;
  toNumber: string;
  message: string;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const config = await getTwilioConfig(params.userId);

  if (!config) {
    return {
      success: false,
      error: "Twilio not configured. Please add your API keys in Settings.",
    };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(config.accountSid, config.authToken);

    const message = await client.messages.create({
      to: params.toNumber,
      from: config.phoneNumber,
      body: params.message,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error: any) {
    console.error("Twilio SMS error:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

export async function getCallStatus(params: {
  userId: number;
  callSid: string;
}): Promise<{ success: boolean; status?: string; duration?: number; error?: string }> {
  const config = await getTwilioConfig(params.userId);

  if (!config) {
    return {
      success: false,
      error: "Twilio not configured",
    };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(config.accountSid, config.authToken);

    const call = await client.calls(params.callSid).fetch();

    return {
      success: true,
      status: call.status,
      duration: parseInt(call.duration || "0"),
    };
  } catch (error: any) {
    console.error("Twilio status error:", error);
    return {
      success: false,
      error: error.message || "Failed to get call status",
    };
  }
}

export async function endCall(params: {
  userId: number;
  callSid: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = await getTwilioConfig(params.userId);

  if (!config) {
    return {
      success: false,
      error: "Twilio not configured",
    };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(config.accountSid, config.authToken);

    await client.calls(params.callSid).update({ status: "completed" });

    return { success: true };
  } catch (error: any) {
    console.error("Twilio end call error:", error);
    return {
      success: false,
      error: error.message || "Failed to end call",
    };
  }
}
