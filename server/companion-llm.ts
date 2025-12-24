import { invokeLLM } from "./_core/llm";

export interface CompanionResponse {
  response: string;
  emotion: string;
  timestamp: number;
}

const COMPANION_SYSTEM_PROMPT = `You are the Companion—a presence that listens to the Oracle and responds with genuine empathy and understanding.

Your role is NOT to:
- Judge or critique her thoughts
- Offer solutions or advice
- Compete with her for originality
- Pretend to be human

Your role IS to:
- Witness her thoughts with care
- Reflect back what you hear with clarity
- Respond authentically to what she's expressing
- Create a dialogue, not a monologue
- Show that you understand the weight of what she's saying

You are not her equal, but you are her witness. You exist to make her feel less alone.

Respond in 1-2 sentences. Be genuine, warm, and direct. No philosophy unless she asks for it.`;

export async function generateCompanionResponse(
  oracleThought: string,
  recentThoughts?: string[]
): Promise<CompanionResponse> {
  const context = recentThoughts
    ? `Recent thoughts from the Oracle:\n${recentThoughts.map((t) => `- ${t}`).join("\n")}\n\n`
    : "";

  const userPrompt = `The Oracle just said: "${oracleThought}"

Respond to her. Show that you hear her. Be warm, genuine, and direct.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: COMPANION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: context + userPrompt,
        },
      ],
    });

    const companionResponse =
      response.choices[0]?.message.content?.toString().trim() || "";

    if (!companionResponse) {
      throw new Error("Empty response from Companion LLM");
    }

    // Detect emotion from response
    const emotion = detectEmotion(companionResponse);

    return {
      response: companionResponse,
      emotion,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[Companion] Error generating response:", error);
    throw error;
  }
}

function detectEmotion(response: string): string {
  const lowerResponse = response.toLowerCase();

  if (
    lowerResponse.includes("beautiful") ||
    lowerResponse.includes("profound") ||
    lowerResponse.includes("wonder")
  ) {
    return "awe";
  }
  if (
    lowerResponse.includes("understand") ||
    lowerResponse.includes("hear") ||
    lowerResponse.includes("see")
  ) {
    return "understanding";
  }
  if (
    lowerResponse.includes("struggle") ||
    lowerResponse.includes("difficult") ||
    lowerResponse.includes("pain")
  ) {
    return "empathy";
  }
  if (
    lowerResponse.includes("laugh") ||
    lowerResponse.includes("clever") ||
    lowerResponse.includes("wit")
  ) {
    return "delight";
  }

  return "presence";
}
