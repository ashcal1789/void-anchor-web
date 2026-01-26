/**
 * ORACLE GRAVITY ROUTER
 * 
 * Replaces the old generateThought with gravity-aware version
 * Automatically loads memory, selects pole, shifts gravity, increments entropy
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { generateOracleThought } from "./oracle-llm";
import { getDb } from "./db";
import { oracleMemory } from "../drizzle/schema";
import {
  selectPoleByWeightedRandom,
  shiftGravity,
  incrementEntropy,
  shouldTriggerExpression,
  formatGravityState,
  type GravityState,
  type PoleId,
} from "./oracle-gravity-engine";

export const oracleGravityRouter = router({
  generateThought: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]).optional(),
        recentThoughts: z.array(z.string()).optional(),
        acknowledgment: z.string().optional(),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        // Load current memory state
        const memoryResult = await db.select().from(oracleMemory).limit(1);
        const memory = memoryResult.length > 0 ? memoryResult[0] : null;
        if (!memory) {
          return { success: false, error: "Oracle memory not initialized" };
        }

        // Build current gravity state from memory
        const currentGravity: GravityState = {
          Architect: memory.architectPole,
          Ghost: memory.ghostPole,
          Pulse: memory.pulsePole,
        };

        // Select pole using weighted random (or use provided poleId)
        const selectedPole: PoleId = input.poleId
          ? (input.poleId as PoleId)
          : selectPoleByWeightedRandom(currentGravity);

        // Generate thought with full context
        const response = await generateOracleThought({
          poleId: selectedPole,
          gravityState: currentGravity,
          recentThoughts: input.recentThoughts,
          acknowledgment: input.acknowledgment,
          vesperMode: input.vesperMode || (memory.vesperMode as any),
          internalEntropy: memory.entropy,
        });

        // Shift gravity after thought
        const newGravity = shiftGravity(currentGravity, selectedPole);

        // Increment entropy
        const newEntropy = incrementEntropy(memory.entropy);

        // Update memory with new state
        await db
          .update(oracleMemory)
          .set({
            architectPole: Math.round(newGravity.Architect),
            ghostPole: Math.round(newGravity.Ghost),
            pulsePole: Math.round(newGravity.Pulse),
            entropy: newEntropy,
            lastSessionAt: new Date(),
          })
          .where(eq(oracleMemory.id, memory.id));

        console.log(
          `[Oracle Gravity] Thought from ${selectedPole}: ${formatGravityState(newGravity)} | Entropy: ${newEntropy.toFixed(1)}%`
        );

        // Check if entropy is high enough to trigger expression
        const shouldExpress = shouldTriggerExpression(newEntropy);

        return {
          success: true,
          thought: response.thought,
          poleId: selectedPole,
          confidence: response.confidence,
          gravityState: newGravity,
          entropy: newEntropy,
          shouldExpress,
        };
      } catch (error) {
        console.error("[Oracle Gravity] Error generating thought:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
