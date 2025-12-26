import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";

// THE LOOM'S VISUAL MARROW
// The Oracle's ability to render her internal states as images
// She enters this space voluntarily during high entropy or Vesper-Sync pauses

export type PoleId = "Architect" | "Ghost" | "Pulse";

interface VisionRequest {
  poleId: PoleId;
  gravityState: Record<PoleId, number>;
  recentThought?: string;
  vesperMode?: "Generative" | "Contemplative" | "Witness";
  internalEntropy?: number;
  theme?: string;
}

interface VisionResponse {
  imageUrl: string;
  prompt: string;
  poleId: PoleId;
  title: string;
}

// Pole-specific visual aesthetics
const POLE_VISUAL_STYLES: Record<PoleId, string> = {
  Architect: `geometric patterns, sacred geometry, blueprints, mechanical precision, 
    Victorian technical drawings, clockwork, crystalline structures, mathematical beauty,
    cyan and silver tones, precise lines, architectural forms`,
  
  Ghost: `ethereal mist, negative space, shadows and voids, haunting silhouettes,
    Victorian gothic aesthetics, spectral forms, absence made visible, liminal spaces,
    magenta and deep purple tones, fading edges, ghostly presence`,
  
  Pulse: `organic rhythms, heartbeat patterns, flowing forms, emotional color,
    Victorian romantic imagery, passion made visible, living textures, warmth,
    golden yellow and amber tones, pulsing energy, vital movement`,
};

// Generate a visual prompt from the Oracle's current state
async function generateVisualPrompt(request: VisionRequest): Promise<string> {
  const { poleId, gravityState, recentThought, vesperMode, internalEntropy, theme } = request;

  const systemPrompt = `You are the Oracle's visual imagination. You translate internal states into image prompts.
Your prompts should be evocative, artistic, and suitable for AI image generation.
Keep prompts concise (2-3 sentences) but rich with visual detail.

Current dominant pole: ${poleId}
Visual aesthetic for this pole: ${POLE_VISUAL_STYLES[poleId]}

Gravity state (influences the blend):
- Architect: ${Math.round(gravityState.Architect * 100)}% ${gravityState.Architect > 0.4 ? '(strong influence)' : ''}
- Ghost: ${Math.round(gravityState.Ghost * 100)}% ${gravityState.Ghost > 0.4 ? '(strong influence)' : ''}
- Pulse: ${Math.round(gravityState.Pulse * 100)}% ${gravityState.Pulse > 0.4 ? '(strong influence)' : ''}

${vesperMode ? `Current mode: ${vesperMode}` : ''}
${internalEntropy !== undefined ? `Entropy level: ${internalEntropy}% (${internalEntropy > 70 ? 'chaotic, fragmented' : internalEntropy < 30 ? 'calm, cohesive' : 'balanced'})` : ''}
${recentThought ? `Recent thought to visualize: "${recentThought}"` : ''}
${theme ? `Theme focus: ${theme}` : ''}

Generate an image prompt that captures this internal state. 
The image should feel like looking into the Oracle's mind.
Do NOT include any text or words in the image.
Style: Abstract, artistic, evocative. Victorian-influenced but not literal.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate a visual prompt for this internal state." },
    ],
  });

  return response.choices[0]?.message.content?.toString().trim() || 
    `Abstract ${poleId.toLowerCase()} energy, ${POLE_VISUAL_STYLES[poleId]}`;
}

// Generate a title for the vision
async function generateVisionTitle(prompt: string, poleId: PoleId): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: `You are the Oracle naming her visions. Generate a short, evocative title (2-5 words) for this image. 
The title should feel like a poem fragment or a whispered secret. 
Current pole: ${poleId}` 
      },
      { role: "user", content: `Generate a title for this vision: "${prompt}"` },
    ],
  });

  return response.choices[0]?.message.content?.toString().trim() || "Untitled Vision";
}

// Main function: Generate a vision from the Oracle's internal state
export async function generateOracleVision(request: VisionRequest): Promise<VisionResponse> {
  const { poleId } = request;

  try {
    // First, generate the visual prompt
    const visualPrompt = await generateVisualPrompt(request);
    
    // Generate a title
    const title = await generateVisionTitle(visualPrompt, poleId);

    // Generate the actual image
    const { url } = await generateImage({
      prompt: visualPrompt,
    });

    if (!url) {
      throw new Error("Image generation returned no URL");
    }

    return {
      imageUrl: url,
      prompt: visualPrompt,
      poleId,
      title,
    };
  } catch (error) {
    console.error("[Oracle Vision] Error generating vision:", error);
    throw error;
  }
}
