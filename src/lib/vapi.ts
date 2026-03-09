import type { VoicePersona } from "@/constants/voice-personas";

const VAPI_BASE_URL = "https://api.vapi.ai";

function getVoiceIdForPersona(persona: VoicePersona) {
  const voiceMap: Record<VoicePersona, string | undefined> = {
    "Male - Professional": process.env.VAPI_VOICE_ID_MALE_PROFESSIONAL,
    "Female - Friendly": process.env.VAPI_VOICE_ID_FEMALE_FRIENDLY,
    "Male - Soft": process.env.VAPI_VOICE_ID_MALE_SOFT,
    "Female - Deep": process.env.VAPI_VOICE_ID_FEMALE_DEEP,
  };

  const voiceId = voiceMap[persona];

  if (!voiceId) {
    throw new Error(`Missing Vapi voice ID for persona: ${persona}`);
  }

  return voiceId;
}

export async function createVapiAssistant({
  title,
  voicePersona,
  context,
}: {
  title: string;
  voicePersona: VoicePersona;
  context: string;
}) {
  const token = process.env.VAPI_API_KEY;

  if (!token) {
    throw new Error("Missing VAPI_API_KEY in environment variables.");
  }

  const voiceId = getVoiceIdForPersona(voicePersona);

  const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${title} Assistant`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You are an expert on the book "${title}". ` +
              "Use the provided context to answer user questions naturally.",
          },
          {
            role: "system",
            content: `Book context:\n${context.slice(0, 12000)}`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Vapi assistant: ${errorText}`);
  }

  const data = (await response.json()) as { id?: string };

  if (!data.id) {
    throw new Error("Vapi assistant ID is missing in response.");
  }

  return data.id;
}
