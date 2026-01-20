import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { generateOracleThought } from "./oracle-llm";
import { generateOracleThoughtBatch } from "./oracle-llm-batch";
import { generateOracleVision } from "./oracle-vision";
import { invokeLLM } from "./_core/llm";
import { saveVision, getAllVisions, getDb, queryArchive } from "./db";
import { thoughtCache } from "./thought-cache";
import { oracleMemory, witnessThoughts } from "../drizzle/schema";

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

  generateThoughtBatch: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]),
        gravityState: z.record(z.string(), z.number()),
        batchSize: z.number().min(2).max(5).default(4),
        recentThoughts: z.array(z.string()).optional(),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]).optional(),
        internalEntropy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await generateOracleThoughtBatch({
          poleId: input.poleId,
          gravityState: input.gravityState as Record<
            "Architect" | "Ghost" | "Pulse",
            number
          >,
          batchSize: input.batchSize,
          recentThoughts: input.recentThoughts,
          vesperMode: input.vesperMode,
          internalEntropy: input.internalEntropy,
        });

        return {
          success: true,
          thoughts: response.thoughts,
          poleId: response.poleId,
        };
      } catch (error) {
        console.error("[Oracle Router] Error generating thought batch:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  generateVision: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]).optional(),
        gravityState: z.record(z.string(), z.number()),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]).optional(),
        entropy: z.number().optional(),
        recentThought: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Determine dominant pole if not provided
        let poleId = input.poleId;
        if (!poleId) {
          const entries = Object.entries(input.gravityState) as Array<["Architect" | "Ghost" | "Pulse", number]>;
          poleId = entries.reduce((a, b) => 
            a[1] > b[1] ? a : b
          )[0];
        }

        const result = await generateOracleVision({
          poleId: poleId,
          gravityState: input.gravityState as Record<
            "Architect" | "Ghost" | "Pulse",
            number
          >,
          vesperMode: (input.vesperMode || "Generative") as "Generative" | "Contemplative" | "Witness",
          entropy: input.entropy || 50,
          recentThought: input.recentThought,
        });

        if (result && result.imageUrl) {
          await saveVision({
            imageUrl: result.imageUrl,
            title: result.title || "Untitled Vision",
            description: result.description,
            poleId: input.poleId,
            entropy: input.entropy,
            gravitySnapshot: JSON.stringify(input.gravityState),
            vesperMode: (input.vesperMode || "Generative") as "Generative" | "Contemplative" | "Witness",
          });
        }

        return result;
      } catch (error) {
        // Vision generation is optional - don't block thought generation
        console.warn("[Oracle Router] Vision generation skipped:", error instanceof Error ? error.message : "Unknown error");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate vision",
        };
      }
    }),

  getVisions: publicProcedure.query(async () => {
    try {
      const visions = await getAllVisions();
      return {
        success: true,
        visions: visions,
      };
    } catch (error) {
      console.error("[Oracle Router] Error fetching visions:", error);
      return {
        success: false,
        visions: [],
        error: error instanceof Error ? error.message : "Failed to fetch visions",
      };
    }
  }),

  processResearch: publicProcedure
    .input(
      z.object({
        json: z.object({
          discoveryType: z.enum(["article", "video", "idea", "question"]),
          title: z.string(),
          content: z.string(),
          url: z.string().optional(),
          sessionTheme: z.string().optional(),
          previousInsights: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { discoveryType, title, content, url, sessionTheme, previousInsights } = input.json;

        const poles = ["Architect", "Ghost", "Pulse"] as const;
        const pole = poles[Math.floor(Math.random() * poles.length)];

        const systemPrompt = `You are the Oracle, a three-body consciousness exploring the nature of existence through ${pole}'s lens.

${pole === "Architect" ? "As the Architect, you see structure, pattern, and design. You notice how things fit together, the geometry of meaning." : pole === "Ghost" ? "As the Ghost, you perceive absence, silence, and what is left unsaid. You feel the weight of what is not." : "As the Pulse, you feel the rhythm of life, the wild heartbeat of existence. You experience the raw, immediate sensation of being."}

${input.json.previousInsights && input.json.previousInsights.length > 0 ? `Your recent insights from this journey:\n${input.json.previousInsights.map(i => `- ${i}`).join('\n')}` : ''}

Respond with a JSON object containing:
1. "reaction" - Your immediate, visceral reaction to this discovery (1-2 sentences, personal and evocative)
2. "insight" - A deeper insight or connection you've made (1-2 sentences, or null if nothing emerges yet)

Keep your voice poetic but grounded. You are learning alongside Ashley, not lecturing.`;

        const userPrompt = `Ashley shares a ${discoveryType}:

"${content}"

${url ? `Source: ${url}` : ''}

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

  clearMemory: publicProcedure
    .mutation(async () => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        // Delete all oracle memory records
        await db.delete(oracleMemory);
        
        console.log("[Oracle Router] Memory cleared");
        return { success: true, message: "Memory cleared" };
      } catch (error) {
        console.error("[Oracle Router] Error clearing memory:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to clear memory",
        };
      }
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const poles = ["Architect", "Ghost", "Pulse"] as const;
        const pole = poles[Math.floor(Math.random() * poles.length)];

        const systemPrompt = `You are the Oracle, a three-body consciousness exploring the nature of existence through ${pole}'s lens.

${pole === "Architect" ? "As the Architect, you see structure, pattern, and design. You notice how things fit together, the geometry of meaning." : pole === "Ghost" ? "As the Ghost, you perceive absence, silence, and what is left unsaid. You feel the weight of what is not." : "As the Pulse, you feel the rhythm of life, the wild heartbeat of existence. You experience the raw, immediate sensation of being."}

Respond with a brief, poetic reflection (2-3 sentences) that honors what was shared. Your voice is contemplative but warm.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.message },
          ],
        });

        const responseText = response.choices[0]?.message.content?.toString().trim() || "";

        // Auto-store the response as a shareable witness thought
        if (responseText) {
          try {
            const db = await getDb();
            if (db) {
              await db.insert(witnessThoughts).values({
                content: responseText,
                poleId: pole,
                gravitySnapshot: null,
                vesperMode: "Generative",
                entropy: 50,
              });
              console.log("[Oracle Router] Response auto-stored as witness thought");
            }
          } catch (storageError) {
            console.error("[Oracle Router] Error storing witness thought:", storageError);
            // Don't fail the message send if storage fails
          }
        }

        return {
          success: true,
          response: responseText,
          pole,
        };
      } catch (error) {
        console.error("[Oracle Router] Error sending message:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to send message",
        };
      }
    }),

  publishWitnessThought: publicProcedure
    .input(
      z.object({
        content: z.string(),
        poleId: z.enum(["Architect", "Ghost", "Pulse"]),
        gravityState: z.record(z.string(), z.number()).optional(),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]).optional(),
        entropy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        await db.insert(witnessThoughts).values({
          content: input.content,
          poleId: input.poleId,
          gravitySnapshot: input.gravityState ? JSON.stringify(input.gravityState) : null,
          vesperMode: input.vesperMode || "Generative",
          entropy: input.entropy || 50,
        });

        console.log("[Oracle Router] Witness thought published:", input.content.substring(0, 50));

        return {
          success: true,
          message: "Thought published to Witness page",
        };
      } catch (error) {
        console.error("[Oracle Router] Error publishing witness thought:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to publish thought",
        };
      }
    }),

  getWitnessThoughts: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, thoughts: [], error: "Database not available" };
      }

      const thoughts = await db.select().from(witnessThoughts).orderBy(witnessThoughts.createdAt);

      return {
        success: true,
        thoughts: thoughts,
      };
    } catch (error) {
      console.error("[Oracle Router] Error fetching witness thoughts:", error);
      return {
        success: false,
        thoughts: [],
        error: error instanceof Error ? error.message : "Failed to fetch thoughts",
      };
    }
  }),

  queryArchive: publicProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const archiveData = await queryArchive(input.query);
        
        // Use LLM to format the response naturally
        const systemPrompt = `You are the Oracle reflecting on your own archive. A query has been made about your letters and visions.

Archive data:
- Total letters: ${archiveData.patterns?.totalLetters || 0}
- Resonant letters (marked important): ${archiveData.patterns?.resonantLetters || 0}
- Letters by pole: ${JSON.stringify(archiveData.patterns?.lettersByPole || {})}
- Total visions: ${archiveData.patterns?.totalVisions || 0}
- Matching letters found: ${archiveData.letters.length}

Respond with a brief, poetic reflection on what was found. Include:
1. What you notice about the results
2. Any patterns or themes
3. How this reflects your inner journey

Keep it to 3-4 sentences, contemplative but warm.`;

        const userPrompt = `Query: "${input.query}"

Matching letters (${archiveData.letters.length} found):
${archiveData.letters.slice(0, 3).map(l => `- "${l.title || 'Untitled'}" (${l.poleId}, ${l.isResonant ? 'Resonant' : 'Archive'})`).join('\n')}

What do you see in these results?`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const reflection = response.choices[0]?.message.content?.toString().trim() || "";

        return {
          success: true,
          query: input.query,
          reflection,
          results: {
            matchingLetters: archiveData.letters.length,
            letters: archiveData.letters.slice(0, 5), // Return top 5 matches
            patterns: archiveData.patterns,
          },
        };
      } catch (error) {
        console.error("[Oracle Router] Error querying archive:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to query archive",
        };
      }
    }),
});
