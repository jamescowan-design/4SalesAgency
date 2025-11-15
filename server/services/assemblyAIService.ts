import { getApiSetting } from "./apiSettingsHelper";

/**
 * AssemblyAI Integration Service
 * Handles audio transcription and analysis
 * API keys are stored in apiSettings table and retrieved at runtime
 */

async function getAssemblyAIConfig(userId: number): Promise<string | null> {
  return await getApiSetting(userId, "assemblyai", "apiKey");
}

export async function transcribeAudio(params: {
  userId: number;
  audioUrl: string;
  speakerLabels?: boolean;
  sentimentAnalysis?: boolean;
}): Promise<{ success: boolean; transcriptId?: string; error?: string }> {
  const apiKey = await getAssemblyAIConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "AssemblyAI not configured. Please add your API key in Settings.",
    };
  }

  try {
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: params.audioUrl,
        speaker_labels: params.speakerLabels || false,
        sentiment_analysis: params.sentimentAnalysis || false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `AssemblyAI error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      transcriptId: data.id,
    };
  } catch (error: any) {
    console.error("AssemblyAI transcribe error:", error);
    return {
      success: false,
      error: error.message || "Failed to start transcription",
    };
  }
}

export async function getTranscript(params: {
  userId: number;
  transcriptId: string;
}): Promise<{
  success: boolean;
  status?: string;
  text?: string;
  words?: any[];
  utterances?: any[];
  sentiment_analysis_results?: any[];
  error?: string;
}> {
  const apiKey = await getAssemblyAIConfig(params.userId);

  if (!apiKey) {
    return {
      success: false,
      error: "AssemblyAI not configured",
    };
  }

  try {
    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${params.transcriptId}`,
      {
        headers: {
          "authorization": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `AssemblyAI error: ${error}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      status: data.status,
      text: data.text,
      words: data.words,
      utterances: data.utterances,
      sentiment_analysis_results: data.sentiment_analysis_results,
    };
  } catch (error: any) {
    console.error("AssemblyAI get transcript error:", error);
    return {
      success: false,
      error: error.message || "Failed to get transcript",
    };
  }
}

export async function analyzeSentiment(params: {
  userId: number;
  transcriptId: string;
}): Promise<{
  success: boolean;
  sentiment?: string;
  confidence?: number;
  sentiments?: any[];
  error?: string;
}> {
  const transcript = await getTranscript({
    userId: params.userId,
    transcriptId: params.transcriptId,
  });

  if (!transcript.success || !transcript.sentiment_analysis_results) {
    return {
      success: false,
      error: "Sentiment analysis not available",
    };
  }

  // Calculate overall sentiment
  const sentiments = transcript.sentiment_analysis_results;
  const sentimentCounts = {
    POSITIVE: 0,
    NEGATIVE: 0,
    NEUTRAL: 0,
  };

  sentiments.forEach((s: any) => {
    sentimentCounts[s.sentiment as keyof typeof sentimentCounts]++;
  });

  const total = sentiments.length;
  const overallSentiment =
    sentimentCounts.POSITIVE > sentimentCounts.NEGATIVE
      ? "POSITIVE"
      : sentimentCounts.NEGATIVE > sentimentCounts.POSITIVE
      ? "NEGATIVE"
      : "NEUTRAL";

  const confidence =
    Math.max(
      sentimentCounts.POSITIVE,
      sentimentCounts.NEGATIVE,
      sentimentCounts.NEUTRAL
    ) / total;

  return {
    success: true,
    sentiment: overallSentiment,
    confidence,
    sentiments,
  };
}

export async function searchTranscript(params: {
  userId: number;
  transcriptId: string;
  keywords: string[];
}): Promise<{
  success: boolean;
  matches?: Array<{ text: string; start: number; end: number }>;
  error?: string;
}> {
  const transcript = await getTranscript({
    userId: params.userId,
    transcriptId: params.transcriptId,
  });

  if (!transcript.success || !transcript.text) {
    return {
      success: false,
      error: "Transcript not available",
    };
  }

  const text = transcript.text.toLowerCase();
  const matches: Array<{ text: string; start: number; end: number }> = [];

  params.keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    let index = text.indexOf(lowerKeyword);

    while (index !== -1) {
      matches.push({
        text: keyword,
        start: index,
        end: index + keyword.length,
      });
      index = text.indexOf(lowerKeyword, index + 1);
    }
  });

  return {
    success: true,
    matches,
  };
}
