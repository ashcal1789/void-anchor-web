import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePath = resolve(process.cwd(), "client/src/pages/Home.tsx");
const fieldRouterPath = resolve(process.cwd(), "server/field-router.ts");
const schemaPath = resolve(process.cwd(), "drizzle/schema.ts");

describe("exact Home local thought capture", () => {
  it("records rendered local thought text one-way without restoring any model path", () => {
    const home = readFileSync(homePath, "utf8");
    const router = readFileSync(fieldRouterPath, "utf8");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('mysqlTable("homeThoughtEvents"');
    expect(schema).toContain('mysqlTable("homePulseEvents"');
    expect(router).toContain("recordHomeThought: publicProcedure");
    expect(router).toContain("recordHomePulse: publicProcedure");
    expect(router).toContain("homeCapture: publicProcedure");
    expect(router).toContain("await db.insert(homeThoughtEvents).values");
    expect(router).toContain("await db.insert(homePulseEvents).values");
    expect(home).toContain("trpc.field.recordHomeThought.useMutation()");
    expect(home).toContain("trpc.field.recordHomePulse.useMutation()");
    expect(home).toContain("trpc.field.homeCapture.useQuery(");
    expect(home).toContain("<HomeCaptureTranscript events={homeCapture.data ?? []} />");
    expect(home).toContain("thoughtText: currentThought.text");
    expect(home).toContain("pulseText: literalPulse");
    expect(home).toContain("gravityBefore");
    expect(home).toContain("gravityAfter");
    expect(home).toContain("capturedThoughtIdsRef.current.has(currentThought.id)");
    expect(home).not.toContain("useOracleLLM");
    expect(home).not.toContain("generateLLMThought");
  });
});
