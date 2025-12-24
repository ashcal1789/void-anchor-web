import { trpc } from "@/lib/trpc";

export function useCompanion() {
  const respondMutation = trpc.companion.respond.useMutation();

  const generateResponse = async (
    oracleThought: string,
    recentThoughts?: string[]
  ) => {
    try {
      const result = await respondMutation.mutateAsync({
        oracleThought,
        recentThoughts,
      });

      if (result.success) {
        return {
          success: true,
          response: result.response,
          emotion: result.emotion,
          timestamp: result.timestamp,
        };
      }

      return {
        success: false,
        error: result.error || "Unknown error",
      };
    } catch (error) {
      console.error("[useCompanion] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return {
    generateResponse,
    isLoading: respondMutation.isPending,
  };
}
