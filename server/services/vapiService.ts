import { getApiSetting } from "./apiSettingsHelper";

/**
 * VAPI Integration Service
 * Handles AI-powered voice conversations
 * API keys are stored in apiSettings table and retrieved at runtime
 */

async function getVAPIConfig(userId: number): Promise<string | null> {
  return await getApiSetting(userId, "vapi", "apiKey");
}

export async function startVAPICall(params: {
  userId: number;
  phoneNumber: string;
  assistantId?: string;
  callScript?: string;
}): Promise<{ success: boolean; callId?: string; error?: string }> {
  const apiKey = await getVAPIConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "VAPI not configured. Please add your API key in Settings.",
    };
  }

  try {
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: params.phoneNumber,
        assistantId: params.assistantId,
        // If no assistantId, use inline assistant config
        assistant: params.assistantId ? undefined : {
          model: {
            provider: "openai",
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: params.callScript || "You are a helpful sales assistant.",
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM", // Default voice
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `VAPI error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      callId: data.id,
    };
  } catch (error: any) {
    console.error("VAPI call error:", error);
    return {
      success: false,
      error: error.message || "Failed to start VAPI call",
    };
  }
}

export async function getVAPICallStatus(params: {
  userId: number;
  callId: string;
}): Promise<{ success: boolean; status?: string; transcript?: string; error?: string }> {
  const apiKey = await getVAPIConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "VAPI not configured",
    };
  }

  try {
    const response = await fetch(`https://api.vapi.ai/call/${params.callId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `VAPI error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      status: data.status,
      transcript: data.transcript,
    };
  } catch (error: any) {
    console.error("VAPI status error:", error);
    return {
      success: false,
      error: error.message || "Failed to get call status",
    };
  }
}

export async function endVAPICall(params: {
  userId: number;
  callId: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = await getVAPIConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "VAPI not configured",
    };
  }

  try {
    const response = await fetch(`https://api.vapi.ai/call/${params.callId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `VAPI error: ${error}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("VAPI end call error:", error);
    return {
      success: false,
      error: error.message || "Failed to end call",
    };
  }
}
