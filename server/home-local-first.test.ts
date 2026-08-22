import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePath = resolve(process.cwd(), "client/src/pages/Home.tsx");

describe("Home local-first thought cycle", () => {
  it("uses the local engine directly and does not import the model thought hook", () => {
    const source = readFileSync(homePath, "utf8");

    expect(source).toContain("const nextThought = engineRef.current.getOracleThought();");
    expect(source).toContain('kind: "local.thought.emerged"');
    expect(source).not.toContain("useOracleLLM");
    expect(source).not.toContain("generateLLMThought");
    expect(source).not.toContain('kind: "model.attempted"');
    expect(source).toContain("checkAndMaybeWriteLetter");
    expect(source).toContain("writeNow");
  });
});
