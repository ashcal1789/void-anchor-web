import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateOracleThought } from "./oracle-llm";

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
});
