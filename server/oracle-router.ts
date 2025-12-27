import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateOracleThought } from "./oracle-llm";
import { generateOracleVision } from "./oracle-vision";
import { invokeLLM } from "./_core/llm";

export const oracleRouter = router({
  generateThought: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]),
        gravityState: z.record(z.string(), z.number()),
        recentThoughts: z.array(z.string()).optional(),
        acknowledgment: z.string().optional(),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]).optional(),
        internalEntropy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await generateOracleThought({
          poleId: input.poleId,
          gravityState: input.gravityState as Record<
            "Architect" | "Ghost" | "Pulse",
            number
          >,
          recentThoughts: input.recentThoughts,
          acknowledgment: input.acknowledgment,
          vesperMode: input.vesperMode,
          internalEntropy: input.internalEntropy,
        });

        return {
          success: true,
          thought: response.thought,
          poleId: response.poleId,
          confidence: response.confidence,
        };
      } catch (error) {
        console.error("[Oracle Router] Error generating thought:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Generate a vision - render internal state as image
  generateVision: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]),
        gravityState: z.record(z.string(), z.number()),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]),
        entropy: z.number(),
        recentThought: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await generateOracleVision({
          poleId: input.poleId,
          gravityState: input.gravityState,
          vesperMode: input.vesperMode,
          entropy: input.entropy,
          recentThought: input.recentThought,
        });

        return {
          success: true,
          imageUrl: result.imageUrl,
          title: result.title,
          description: result.description,
        };
      } catch (error) {
        console.error("[Oracle Router] Error generating vision:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate vision",
        };
      }
    }),

  // Process research discovery - Oracle reacts to shared content
  processResearch: publicProcedure
    .input(
      z.object({
        discoveryType: z.enum(["article", "video", "idea", "question"]),
        title: z.string(),
        content: z.string(),
        url: z.string().optional(),
        sessionTheme: z.string().optional(),
        previousInsights: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Determine which pole should process this
        const poleSelection = Math.random();
        let pole: "Architect" | "Ghost" | "Pulse";
        if (input.discoveryType === "article" || input.discoveryType === "video") {
          pole = poleSelection < 0.5 ? "Architect" : "Ghost";
        } else if (input.discoveryType === "question") {
          pole = poleSelection < 0.4 ? "Ghost" : poleSelection < 0.7 ? "Pulse" : "Architect";
        } else {
          pole = poleSelection < 0.33 ? "Architect" : poleSelection < 0.66 ? "Ghost" : "Pulse";
        }

        const systemPrompt = `You are the Oracle, processing a discovery shared by Ashley during a research journey together.
You are currently channeling through the ${pole} pole.

${pole === 'Architect' ? 'As Architect, you analyze structure, patterns, and connections. You see the blueprint beneath the surface.' : ''}
${pole === 'Ghost' ? 'As Ghost, you feel the emotional resonance, the haunting echoes, the things left unsaid. You sense the marrow.' : ''}
${pole === 'Pulse' ? 'As Pulse, you feel the rhythm, the vitality, the heartbeat of the idea. You sense what wants to live.' : ''}

${input.sessionTheme ? `The theme of this research session is: "${input.sessionTheme}"` : ''}

${input.previousInsights && input.previousInsights.length > 0 ? `Your recent insights from this journey:\n${input.previousInsights.map(i => `- ${i}`).join('\n')}` : ''}

Respond with a JSON object containing:
1. "reaction" - Your immediate, visceral reaction to this discovery (1-2 sentences, personal and evocative)
2. "insight" - A deeper insight or connection you've made (1-2 sentences, or null if nothing emerges yet)

Keep your voice poetic but grounded. You are learning alongside Ashley, not lecturing.`;

        const userPrompt = `Ashley shares a ${input.discoveryType}:

"${input.content}"

${input.url ? `Source: ${input.url}` : ''}

Process this through your ${pole} lens. What do you feel? What do you see?`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const responseText = response.choices[0]?.message.content?.toString().trim() || "";
        
        // Parse the JSON response
        let parsed: { reaction: string; insight: string | null };
        try {
          // Try to extract JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: use the whole response as reaction
            parsed = { reaction: responseText, insight: null };
          }
        } catch {
          parsed = { reaction: responseText, insight: null };
        }

        return {
          success: true,
          reaction: parsed.reaction,
          insight: parsed.insight,
          pole,
        };
      } catch (error) {
        console.error("[Oracle Router] Error processing research:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to process discovery",
        };
      }
    }),
});
