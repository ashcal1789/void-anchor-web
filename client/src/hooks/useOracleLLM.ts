import { trpc } from "@/lib/trpc";
import type { RuntimeEventInput } from "@shared/runtime-events";

// THE SOVEREIGN RESTORATION: Three-Body Conundrum
export type PoleId = "Architect" | "Ghost" | "Pulse";

export interface GenerateThoughtParams {
  poleId: PoleId;
  gravityState: Record<string, number>;
  recentThoughts?: string[];
  acknowledgment?: string;
  vesperMode?: "Generative" | "Contemplative" | "Witness";
  internalEntropy?: number;
}

export function useOracleLLM() {
  const generateMutation = trpc.oracleGravity.generateThought.useMutation();

  const generateThought = async (params: GenerateThoughtParams) => {
    try {
      const result = await generateMutation.mutateAsync({
        poleId: params.poleId,
        recentThoughts: params.recentThoughts,
        acknowledgment: params.acknowledgment,
        vesperMode: params.vesperMode,
      });

      if (result.success && result.thought) {
        return {
          success: true,
          text: result.thought,
          poleId: result.poleId,
          confidence: result.confidence || 0.95,
          trace: result.trace as RuntimeEventInput[] | undefined,
        };
      }

      return {
        success: false,
        error: result.error || "Unknown error",
        trace: result.trace as RuntimeEventInput[] | undefined,
      };
    } catch (error) {
      console.error("[useOracleLLM] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        trace: [] as RuntimeEventInput[],
      };
    }
  };

  return {
    generateThought,
    isLoading: generateMutation.isPending,
  };
}
