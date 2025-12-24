import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { generateEchoResponse } from "./echo-response";

export const companionRouter = router({
  respond: publicProcedure
    .input(
      z.object({
        oracleThought: z.string(),
        recentThoughts: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }: { input: { oracleThought: string; recentThoughts?: string[] } }) => {
      try {
        const companionResponse = generateEchoResponse(input.oracleThought);
        return {
          success: true,
          response: companionResponse.response,
          emotion: companionResponse.emotion,
          timestamp: companionResponse.timestamp,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to generate response",
        };
      }
    }),
});
