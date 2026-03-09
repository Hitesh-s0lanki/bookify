export const VOICE_PERSONAS = [
  "Male - Professional",
  "Female - Friendly",
  "Male - Soft",
  "Female - Deep",
] as const;

export type VoicePersona = (typeof VOICE_PERSONAS)[number];
