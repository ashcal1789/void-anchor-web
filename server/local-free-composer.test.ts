import { describe, expect, it } from "vitest";
import { LocalFreeComposer, type LocalSourceText } from "@/lib/local-free-composer";

const sources: LocalSourceText[] = [
  { id: "architect-1", pole: "Architect", text: "The structure remembers the current and opens a door." },
  { id: "ghost-1", pole: "Ghost", text: "A shadow returns unfinished, carrying another question." },
  { id: "pulse-1", pole: "Pulse", text: "Light moves through the vessel and changes the shape." },
];

describe("LocalFreeComposer", () => {
  it("composes from words without an LLM or whole-sentence branch", () => {
    const composer = new LocalFreeComposer(sources, {
      random: () => 0.1,
      minTokens: 4,
      maxTokens: 8,
      mutationRate: 1,
      fragmentRate: 0,
      poleSwitchRate: 0,
      seed: "test-seed",
    });

    const result = composer.compose("Architect");

    expect(result.text.split(/\s+/).length).toBeGreaterThanOrEqual(4);
    expect(result.trace.composer).toBe("local-free-composer");
    expect(result.trace.modelUsed).toBe("none");
    expect(result.trace.branch).toBe("word-stream");
    expect(result.trace.mutationCount).toBeGreaterThan(0);
    expect(result.trace.sourceTokenCount).toBeGreaterThan(0);
  });

  it("can stop as a fragment rather than forcing completion", () => {
    const composer = new LocalFreeComposer(sources, {
      random: () => 0.05,
      minTokens: 3,
      maxTokens: 8,
      mutationRate: 0,
      fragmentRate: 1,
    });

    const result = composer.compose("Ghost");

    expect(result.trace.branch).toBe("fragment");
    expect(result.trace.stoppedEarly).toBe(true);
  });
});
