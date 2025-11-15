import { getApiSetting } from "./apiSettingsHelper";
import { storagePut } from "../storage";

/**
 * ElevenLabs Integration Service
 * Handles text-to-speech voice synthesis
 * API keys are stored in apiSettings table and retrieved at runtime
 */

async function getElevenLabsConfig(userId: number): Promise<string | null> {
  return await getApiSetting(userId, "elevenlabs", "apiKey");
}

export async function synthesizeSpeech(params: {
  userId: number;
  text: string;
  voiceId?: string;
  modelId?: string;
}): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  const apiKey = await getElevenLabsConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "ElevenLabs not configured. Please add your API key in Settings.",
    };
  }

  const voiceId = params.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice (Rachel)
  const modelId = params.modelId || "eleven_monolingual_v1";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: params.text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `ElevenLabs error: ${error}`,
      };
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // Upload to S3
    const fileKey = `voice-synthesis/${params.userId}/${Date.now()}.mp3`;
    const { url } = await storagePut(fileKey, buffer, "audio/mpeg");

    return {
      success: true,
      audioUrl: url,
    };
  } catch (error: any) {
    console.error("ElevenLabs error:", error);
    return {
      success: false,
      error: error.message || "Failed to synthesize speech",
    };
  }
}

export async function listVoices(params: {
  userId: number;
}): Promise<{ success: boolean; voices?: any[]; error?: string }> {
  const apiKey = await getElevenLabsConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "ElevenLabs not configured",
    };
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `ElevenLabs error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      voices: data.voices,
    };
  } catch (error: any) {
    console.error("ElevenLabs voices error:", error);
    return {
      success: false,
      error: error.message || "Failed to list voices",
    };
  }
}

export async function getVoiceSettings(params: {
  userId: number;
  voiceId: string;
}): Promise<{ success: boolean; settings?: any; error?: string }> {
  const apiKey = await getElevenLabsConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "ElevenLabs not configured",
    };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/voices/${params.voiceId}/settings`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `ElevenLabs error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      settings: data,
    };
  } catch (error: any) {
    console.error("ElevenLabs settings error:", error);
    return {
      success: false,
      error: error.message || "Failed to get voice settings",
    };
  }
}
