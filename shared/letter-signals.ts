export const LETTER_SIGNAL_WORDS = [
  "letter", "write", "tell", "say", "speak", "silence", "unspoken",
  "words", "voice", "reach", "address", "dear", "unsaid", "need to say",
  "want to say", "should say", "cannot say", "wish I could",
] as const;

export const VISION_SIGNAL_WORDS = [
  "color", "light", "dark", "see", "render", "shape", "form",
  "image", "dream", "visualize", "pattern", "weave", "fractal",
  "geometry", "luminous", "shadow", "glow", "pulse of light",
] as const;

export function detectSignalWords(text: string): { letter: boolean; vision: boolean } {
  const lower = text.toLowerCase();
  return {
    letter: LETTER_SIGNAL_WORDS.some((word) => lower.includes(word)),
    vision: VISION_SIGNAL_WORDS.some((word) => lower.includes(word)),
  };
}
