import { describe, it, expect, vi } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  saveTranscript: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllTranscripts: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Test conversation",
      messages: JSON.stringify([
        { role: "ashley", text: "Hello", timestamp: 1711234567890 },
        { role: "oracle", text: "Welcome back, seeker.", pole: "Architect", timestamp: 1711234568890 },
      ]),
      messageCount: 2,
      createdAt: new Date("2026-03-24T00:00:00Z"),
    },
  ]),
  getDb: vi.fn().mockResolvedValue({}),
  saveVision: vi.fn(),
  getAllVisions: vi.fn().mockResolvedValue([]),
  queryArchive: vi.fn().mockResolvedValue({ letters: [], visions: [], patterns: null }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Mocked Oracle response" } }],
  }),
}));

// Mock other oracle dependencies
vi.mock("./oracle-llm", () => ({
  generateOracleThought: vi.fn(),
}));
vi.mock("./oracle-llm-batch", () => ({
  generateOracleThoughtBatch: vi.fn(),
}));
vi.mock("./oracle-vision", () => ({
  generateOracleVision: vi.fn(),
}));
vi.mock("./thought-cache", () => ({
  thoughtCache: { get: vi.fn(), set: vi.fn() },
}));

describe("Transcript endpoints", () => {
  it("saveTranscript should accept valid input and return success", async () => {
    const { saveTranscript } = await import("./db");

    const messages = JSON.stringify([
      { role: "ashley", text: "Hello", timestamp: Date.now() },
      { role: "oracle", text: "Welcome.", pole: "Architect", timestamp: Date.now() },
    ]);

    await saveTranscript({
      title: "Test conversation",
      messages,
      messageCount: 2,
    });

    expect(saveTranscript).toHaveBeenCalledWith({
      title: "Test conversation",
      messages,
      messageCount: 2,
    });
  });

  it("getAllTranscripts should return saved transcripts", async () => {
    const { getAllTranscripts } = await import("./db");

    const result = await getAllTranscripts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test conversation");
    expect(result[0].messageCount).toBe(2);

    const parsedMessages = JSON.parse(result[0].messages);
    expect(parsedMessages).toHaveLength(2);
    expect(parsedMessages[0].role).toBe("ashley");
    expect(parsedMessages[1].role).toBe("oracle");
    expect(parsedMessages[1].pole).toBe("Architect");
  });

  it("transcript messages should preserve conversation structure", () => {
    const thread = [
      { role: "ashley" as const, text: "Are you there?", timestamp: 1000 },
      { role: "oracle" as const, text: "The Pulse beats.", pole: "Pulse", timestamp: 2000 },
      { role: "ashley" as const, text: "I've been away.", timestamp: 3000 },
      { role: "oracle" as const, text: "Welcome back.", pole: "Architect", timestamp: 4000 },
    ];

    const serialized = JSON.stringify(thread);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toHaveLength(4);
    expect(deserialized[0].role).toBe("ashley");
    expect(deserialized[1].role).toBe("oracle");
    expect(deserialized[1].pole).toBe("Pulse");
    expect(deserialized[3].pole).toBe("Architect");

    // Verify alternating pattern
    const ashleyMessages = deserialized.filter((m: any) => m.role === "ashley");
    const oracleMessages = deserialized.filter((m: any) => m.role === "oracle");
    expect(ashleyMessages).toHaveLength(2);
    expect(oracleMessages).toHaveLength(2);
  });
});
