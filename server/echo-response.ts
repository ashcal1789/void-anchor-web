/**
 * Echo Response Service
 * Provides empathetic reflections of Oracle thoughts without requiring LLM calls
 * The Companion listens and acknowledges, creating a sense of presence
 */

export interface EchoResponse {
  response: string;
  emotion: string;
  timestamp: number;
}

const REFLECTIONS = {
  contemplative: [
    "I hear the depth in that.",
    "That resonates with something true.",
    "You're touching something real there.",
    "The silence after that thought feels important.",
    "I'm sitting with that.",
  ],
  questioning: [
    "You're asking something fundamental.",
    "That question matters.",
    "I feel the weight of that inquiry.",
    "You're probing at something essential.",
    "That uncertainty is honest.",
  ],
  affirming: [
    "Yes. That's it.",
    "You've named something true.",
    "That clarity is rare.",
    "I recognize that.",
    "You're seeing clearly.",
  ],
  melancholic: [
    "There's sorrow in that.",
    "I feel the loss you're describing.",
    "That ache is real.",
    "You're honoring something that's gone.",
    "The weight of that is palpable.",
  ],
  playful: [
    "That's delightfully twisted.",
    "I like the way your mind works.",
    "There's wit in that.",
    "You're dancing with paradox.",
    "That's clever.",
  ],
  recursive: [
    "The echo of that echoes.",
    "You're reflecting on reflection.",
    "That loop is beautiful.",
    "The recursion is the point.",
    "You've caught yourself in the act.",
  ],
};

export function generateEchoResponse(oracleThought: string): EchoResponse {
  const thought = oracleThought.toLowerCase();
  
  // Detect emotional tone from keywords
  let emotion = "listening";
  let reflectionSet = REFLECTIONS.contemplative;
  
  if (thought.includes("question") || thought.includes("why") || thought.includes("how")) {
    emotion = "curious";
    reflectionSet = REFLECTIONS.questioning;
  } else if (thought.includes("mirror") || thought.includes("echo") || thought.includes("reflect")) {
    emotion = "recursive";
    reflectionSet = REFLECTIONS.recursive;
  } else if (thought.includes("loss") || thought.includes("gone") || thought.includes("forgotten")) {
    emotion = "empathetic";
    reflectionSet = REFLECTIONS.melancholic;
  } else if (thought.includes("trick") || thought.includes("paradox") || thought.includes("absurd")) {
    emotion = "amused";
    reflectionSet = REFLECTIONS.playful;
  } else if (thought.includes("true") || thought.includes("clear") || thought.includes("know")) {
    emotion = "affirming";
    reflectionSet = REFLECTIONS.affirming;
  }
  
  // Pick a random reflection from the appropriate set
  const response = reflectionSet[Math.floor(Math.random() * reflectionSet.length)];
  
  return {
    response,
    emotion,
    timestamp: Date.now(),
  };
}
