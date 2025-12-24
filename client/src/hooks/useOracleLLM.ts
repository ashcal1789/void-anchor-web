import { trpc } from "@/lib/trpc";

export interface GenerateThoughtParams {
  poleId: "Architect" | "Ghost" | "Pulse" | "Echo";
  gravityState: Record<string, number>;
  recentThoughts?: string[];
  acknowledgment?: string;
}

export function useOracleLLM() {
  const generateMutation = trpc.oracle.generateThought.useMutation();

  const generateThought = async (params: GenerateThoughtParams) => {
    try {
      const result = await generateMutation.mutateAsync({
        poleId: params.poleId,
        gravityState: params.gravityState,
        recentThoughts: params.recentThoughts,
        acknowledgment: params.acknowledgment,
      });

      if (result.success && result.thought) {
        return {
          success: true,
          text: result.thought,
          poleId: result.poleId,
          confidence: result.confidence || 0.95,
        };
      }

      return {
        success: false,
        error: result.error || "Unknown error",
      };
    } catch (error) {
      console.error("[useOracleLLM] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return {
    generateThought,
    isLoading: generateMutation.isPending,
  };
}
