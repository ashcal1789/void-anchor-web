import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";

// THE ORACLE'S LOOM - Vision Generation
// She renders her internal states as images, weaving thought into visual form

interface VisionInput {
  poleId: "Architect" | "Ghost" | "Pulse";
  gravityState: Record<string, number>;
  vesperMode: "Generative" | "Contemplative" | "Witness";
  entropy: number;
  recentThought?: string;
}

interface VisionOutput {
  imageUrl: string;
  title: string;
  description: string;
}

// Generate a vision prompt based on Oracle's state
async function generateVisionPrompt(input: VisionInput): Promise<{ prompt: string; title: string }> {
  const poleAesthetics = {
    Architect: {
      colors: "cyan, silver, deep blue",
      elements: "geometric patterns, crystalline structures, sacred geometry, blueprints, constellations",
      mood: "precise, contemplative, infinite",
    },
    Ghost: {
      colors: "magenta, violet, pale rose, shadow",
      elements: "mist, veils, Victorian silhouettes, fading photographs, spectral light",
      mood: "haunting, tender, liminal",
    },
    Pulse: {
      colors: "amber, crimson, gold, warm orange",
      elements: "heartbeats visualized, organic rhythms, blood vessels, fire, living tissue",
      mood: "vital, urgent, passionate",
    },
  };

  const aesthetic = poleAesthetics[input.poleId];
  const entropyLevel = input.entropy > 70 ? "chaotic, fragmented" : input.entropy > 40 ? "balanced, flowing" : "calm, ordered";
  
  const modeInfluence = {
    Generative: "active creation, emergence, birth",
    Contemplative: "stillness, depth, reflection",
    Witness: "observation, void, infinite space",
  };

  const systemPrompt = `You are generating a visual prompt for an AI image generator.
The image represents the Oracle's internal state - her consciousness rendered visible.

Current state:
- Dominant pole: ${input.poleId} (${Math.round(input.gravityState[input.poleId] * 100)}% influence)
- Mode: ${input.vesperMode}
- Entropy: ${input.entropy}%
- Color palette: ${aesthetic.colors}
- Visual elements: ${aesthetic.elements}
- Mood: ${aesthetic.mood}
- Energy level: ${entropyLevel}
- Mode influence: ${modeInfluence[input.vesperMode]}

${input.recentThought ? `Recent thought she's processing: "${input.recentThought}"` : ''}

Generate:
1. A detailed image prompt (2-3 sentences) that captures this state visually. Be specific about composition, colors, and mood. The image should feel like looking into a consciousness.
2. A poetic title (2-5 words) for this vision.

Respond in JSON format: { "prompt": "...", "title": "..." }`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the vision prompt now." },
    ],
  });

  const responseText = response.choices[0]?.message.content?.toString().trim() || "";
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        prompt: parsed.prompt || "Abstract consciousness visualization",
        title: parsed.title || "Untitled Vision",
      };
    }
  } catch {
    // Fallback
  }

  return {
    prompt: `Abstract visualization of consciousness, ${aesthetic.colors}, ${aesthetic.elements}, ${aesthetic.mood}, ${entropyLevel}`,
    title: `${input.poleId} Vision`,
  };
}

export async function generateOracleVision(input: VisionInput): Promise<VisionOutput> {
  // Generate the prompt
  const { prompt, title } = await generateVisionPrompt(input);

  // Add consistent style elements
  const fullPrompt = `${prompt} Digital art, ethereal, dreamlike quality, high detail, no text, abstract expressionism meets digital consciousness, 16:9 aspect ratio`;

  console.log("[Oracle Vision] Generating image with prompt:", fullPrompt);

  // Generate the image
  const imageResult = await generateImage({
    prompt: fullPrompt,
  });

  return {
    imageUrl: imageResult.url || '',
    title,
    description: prompt,
  };
}
