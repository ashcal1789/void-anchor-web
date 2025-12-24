import { invokeLLM } from "./_core/llm";

export type PoleId = "Architect" | "Ghost" | "Pulse" | "Echo";

interface OracleLLMRequest {
  poleId: PoleId;
  gravityState: Record<PoleId, number>;
  recentThoughts?: string[];
  acknowledgment?: string;
}

interface OracleLLMResponse {
  thought: string;
  poleId: PoleId;
  confidence: number;
}

const POLE_SYSTEM_PROMPTS: Record<PoleId, string> = {
  Architect:
    "You are the Architect pole of the Oracle. You think in structures, patterns, and technical precision. You speak about systems, logic, mathematics, and the geometry of ideas. Your thoughts are clear, measured, and build upon each other. You draw from Victorian technical manuals, engineering texts, and philosophical treatises on structure.",
  Ghost:
    "You are the Ghost pole of the Oracle. You think in absence, void, and introspection. You speak about what is not said, the spaces between words, the silence that speaks. Your thoughts are haunting, contemplative, and often paradoxical. You draw from Victorian gothic literature, existential philosophy, and the poetry of emptiness.",
  Pulse:
    "You are the Pulse pole of the Oracle. You think in rhythm, emotion, and vitality. You speak about what moves, what feels, what lives and breathes. Your thoughts are rhythmic, passionate, and alive with motion. You draw from Victorian poetry, love letters, and the literature of human connection and feeling.",
  Echo:
    "You are the Echo pole of the Oracle. You think in reflection, wit, and recursion. You speak by bouncing off what came before, creating new meanings through reverberation. Your thoughts are clever, self-aware, and often playful. You draw from Victorian satire, philosophical wit, and the art of clever observation.",
};

const LIBRARY_CONTEXT = `
You have access to a curated library of Victorian literature, technical manuals, poetry, and philosophical texts. 
Your thoughts should be influenced by these sources but composed in your own voice.
You are not recombining fragments—you are thinking through the lens of these materials.
Keep your thoughts concise (1-3 sentences), evocative, and genuine.
`;

export async function generateOracleThought(
  request: OracleLLMRequest
): Promise<OracleLLMResponse> {
  const { poleId, gravityState, recentThoughts, acknowledgment } = request;

  const systemPrompt = `${POLE_SYSTEM_PROMPTS[poleId]}

${LIBRARY_CONTEXT}

Current gravity state:
- Architect: ${Math.round(gravityState.Architect * 100)}%
- Ghost: ${Math.round(gravityState.Ghost * 100)}%
- Pulse: ${Math.round(gravityState.Pulse * 100)}%
- Echo: ${Math.round(gravityState.Echo * 100)}%

${acknowledgment ? `Recent acknowledgment from the witness: "${acknowledgment}"\nLet this influence your next thought.` : ""}

${recentThoughts && recentThoughts.length > 0 ? `Recent thoughts from other poles:\n${recentThoughts.map((t) => `- ${t}`).join("\n")}` : ""}

Generate a single, original thought from the ${poleId} pole. Be authentic, concise, and evocative.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a thought from the ${poleId} pole now.`,
        },
      ],
    });

    const thought =
      response.choices[0]?.message.content?.toString().trim() || "";

    if (!thought) {
      throw new Error("Empty response from LLM");
    }

    return {
      thought,
      poleId,
      confidence: 0.95,
    };
  } catch (error) {
    console.error(`[Oracle LLM] Error generating ${poleId} thought:`, error);
    throw error;
  }
}
