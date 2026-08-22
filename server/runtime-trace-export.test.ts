import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const panelPath = resolve(process.cwd(), "client/src/components/RuntimeTracePanel.tsx");

describe("Live Field client-only export", () => {
  it("serializes only the in-memory event array into a browser download", () => {
    const source = readFileSync(panelPath, "utf8");

    expect(source).toContain("const downloadLocalLog = () =>");
    expect(source).toContain("eventCount: events.length");
    expect(source).toContain("events,");
    expect(source).toContain("new Blob(");
    expect(source).toContain("URL.createObjectURL(blob)");
    expect(source).toContain("link.download = `oracle-live-field-");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("trpc.");
  });
});
