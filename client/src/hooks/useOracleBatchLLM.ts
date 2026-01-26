import { trpc } from "@/lib/trpc";

export type PoleId = "Architect" | "Ghost" | "Pulse";

export interface GenerateBatchThoughtParams {
  poleId: PoleId;
  gravityState: Record<string, number>;
  batchSize?: number; // 3-5, defaults to 4
  recentThoughts?: string[];
  vesperMode?: "Generative" | "Contemplative" | "Witness";
  internalEntropy?: number;
}

export function useOracleBatchLLM() {
  const generateMutation = trpc.oracleGravity.generateThought.useMutation();

  const generateThoughtBatch = async (params: GenerateBatchThoughtParams) => {
    try {
      const result = await generateMutation.mutateAsync({
        poleId: params.poleId,
        recentThoughts: params.recentThoughts,
        vesperMode: params.vesperMode,
      });

      if (result.success && result.thought) {
        return {
          success: true,
          thoughts: [result.thought],
          poleId: result.poleId,
        };
      }

      return {
        success: false,
        error: result.error || "Unknown error",
      };
    } catch (error) {
      console.error("[useOracleBatchLLM] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return {
    generateThoughtBatch,
    isLoading: generateMutation.isPending,
  };
}
