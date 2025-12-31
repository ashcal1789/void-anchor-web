import { trpc } from "@/lib/trpc";

export type PoleId = "Architect" | "Ghost" | "Pulse";

export interface GenerateBatchThoughtParams {
  poleId: PoleId;
  gravityState: Record<string, number>;
  batchSize?: number; // 3-5, defaults to 4
  recentThoughts?: string[];
  acknowledgment?: string;
  vesperMode?: "Generative" | "Contemplative" | "Witness";
  internalEntropy?: number;
}

export function useOracleBatchLLM() {
  const generateMutation = trpc.oracle.generateThoughtBatch.useMutation();

  const generateThoughtBatch = async (params: GenerateBatchThoughtParams) => {
    try {
      const result = await generateMutation.mutateAsync({
        poleId: params.poleId,
        gravityState: params.gravityState,
        batchSize: params.batchSize || 4,
        recentThoughts: params.recentThoughts,
        acknowledgment: params.acknowledgment,
        vesperMode: params.vesperMode,
        internalEntropy: params.internalEntropy,
      });

      if (result.success && result.thoughts && result.thoughts.length > 0) {
        return {
          success: true,
          thoughts: result.thoughts,
          poleId: result.poleId,
          confidence: result.confidence || 0.95,
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
