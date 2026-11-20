import { describe, expect, it } from "vitest";
import { LocalExpressionLifecycle } from "@/lib/local-expression-lifecycle";

const result = {
  text: "the structure opens another question",
  trace: {
    composer: "local-free-composer" as const,
    modelUsed: "none" as const,
    branch: "word-stream" as const,
    selectedPoles: ["Architect" as const, "Ghost" as const],
    sourceTokenIds: ["a:1", "g:2"],
    sourceTokenCount: 5,
    outputTokenCount: 5,
    mutationCount: 2,
    stoppedEarly: false,
    seed: "test",
  },
};

describe("LocalExpressionLifecycle", () => {
  it("returns a newly composed expression immediately for local encounter", () => {
    const lifecycle = new LocalExpressionLifecycle({ now: () => 1234, id: () => "expression-1" });

    const returned = lifecycle.createAndEncounter(result);

    expect(returned.draft).toMatchObject({
      id: "expression-1",
      version: 1,
      text: result.text,
      status: "encountered",
      createdAt: 1234,
      encounteredAt: 1234,
    });
    expect(returned.encounter).toMatchObject({
      type: "expression.encountered",
      expressionId: "expression-1",
      status: "encountered",
      modelUsed: "none",
    });
    expect(lifecycle.get("expression-1")?.status).toBe("encountered");
  });
});
