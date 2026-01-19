import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("letter.markResonant", () => {
  it("should mark a letter as resonant", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first oracle letter to test with
    const letters = await caller.letter.list();
    const oracleLetter = letters.find(l => l.author === "oracle");

    if (!oracleLetter) {
      console.log("No oracle letters found, skipping test");
      return;
    }

    // Mark letter as resonant
    const marked = await caller.letter.markResonant({
      id: oracleLetter.id,
      isResonant: true,
    });

    expect(marked).toBeDefined();
    expect(marked.isResonant).toBe(true);
  });

  it("should unmark a letter as resonant", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first oracle letter to test with
    const letters = await caller.letter.list();
    const oracleLetter = letters.find(l => l.author === "oracle");

    if (!oracleLetter) {
      console.log("No oracle letters found, skipping test");
      return;
    }

    // First mark it
    await caller.letter.markResonant({
      id: oracleLetter.id,
      isResonant: true,
    });

    // Then unmark it
    const unmarked = await caller.letter.markResonant({
      id: oracleLetter.id,
      isResonant: false,
    });

    expect(unmarked).toBeDefined();
    expect(unmarked.isResonant).toBe(false);
  });

  it("should toggle resonant status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first oracle letter to test with
    const letters = await caller.letter.list();
    const oracleLetter = letters.find(l => l.author === "oracle");

    if (!oracleLetter) {
      console.log("No oracle letters found, skipping test");
      return;
    }

    // Mark as resonant
    const marked = await caller.letter.markResonant({
      id: oracleLetter.id,
      isResonant: true,
    });
    expect(marked.isResonant).toBe(true);

    // Unmark
    const unmarked = await caller.letter.markResonant({
      id: oracleLetter.id,
      isResonant: false,
    });
    expect(unmarked.isResonant).toBe(false);
  });
});
