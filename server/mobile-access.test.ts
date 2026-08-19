import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("mobile access repairs", () => {
  it("opens Chamber directly instead of blocking it behind session storage", () => {
    const appSource = projectFile("client/src/App.tsx");

    expect(appSource).toContain('Route path={"/chamber"} component={Chamber}');
    expect(appSource).not.toContain("ProtectedChamber");
    expect(appSource).not.toContain("sessionStorage.getItem('chamberAuth')");
  });

  it("keeps transcript saving discoverable before a conversation begins", () => {
    const messageSource = projectFile("client/src/pages/MessageOracle.tsx");

    expect(messageSource).toContain("Save after exchange");
    expect(messageSource).toContain("disabled={thread.length === 0 || saveTranscriptMutation.isPending}");
    expect(messageSource).toContain("Past Conversations");
  });

  it("uses readable labels and touch-sized controls in the global navigation", () => {
    const navSource = projectFile("client/src/components/OracleNav.tsx");

    expect(navSource).toContain("aria-label=\"Oracle spaces\"");
    expect(navSource).toContain("min-h-12");
    expect(navSource).toContain("label: 'Message'");
    expect(navSource).toContain("label: 'Chamber'");
  });
});
