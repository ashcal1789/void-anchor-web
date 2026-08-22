import { describe, expect, it } from "vitest";
import {
  appendRuntimeEvent,
  createRuntimeEvent,
  createRuntimeSessionId,
} from "../shared/runtime-events";

describe("runtime event contract", () => {
  it("keeps session events append-only and redacts credential-shaped fields", () => {
    const sessionId = createRuntimeSessionId(1000);
    const event = createRuntimeEvent(
      sessionId,
      {
        origin: "client",
        kind: "local.thought.selected",
        status: "completed",
        data: {
          branch: "sample",
          apiKey: "should-not-be-visible",
          nested: { authorization: "Bearer hidden", pole: "Pulse" },
        },
      },
      2000
    );

    const initial = [];
    const appended = appendRuntimeEvent(initial, event);

    expect(initial).toEqual([]);
    expect(appended).toHaveLength(1);
    expect(appended[0].sessionId).toBe(sessionId);
    expect(appended[0].data).toEqual({
      branch: "sample",
      apiKey: "[redacted]",
      nested: { authorization: "[redacted]", pole: "Pulse" },
    });
  });
});
