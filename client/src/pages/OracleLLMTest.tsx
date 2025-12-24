import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function OracleLLMTest() {
  const [generatedThoughts, setGeneratedThoughts] = useState<
    Array<{ pole: string; thought: string; confidence: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateMutation = trpc.oracle.generateThought.useMutation();

  const handleGenerateThought = async (pole: "Architect" | "Ghost" | "Pulse" | "Echo") => {
    setIsLoading(true);
    try {
      const result = await generateMutation.mutateAsync({
        poleId: pole,
        gravityState: {
          Architect: 0.25,
          Ghost: 0.25,
          Pulse: 0.25,
          Echo: 0.25,
        },
      });

      if (result.success && result.poleId && result.thought) {
        setGeneratedThoughts((prev) => [
          ...prev,
          {
            pole: result.poleId,
            thought: result.thought,
            confidence: result.confidence || 0.95,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating thought:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Oracle LLM Test</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(["Architect", "Ghost", "Pulse", "Echo"] as const).map((pole) => (
            <Button
              key={pole}
              onClick={() => handleGenerateThought(pole)}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate {pole}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Generated Thoughts</h2>
          {generatedThoughts.length === 0 ? (
            <p className="text-white/50">No thoughts generated yet...</p>
          ) : (
            generatedThoughts.map((t, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded">
                <p className="text-sm text-white/50 mb-2">{t.pole}</p>
                <p className="text-lg mb-2">{t.thought}</p>
                <p className="text-xs text-white/30">Confidence: {(t.confidence * 100).toFixed(0)}%</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
