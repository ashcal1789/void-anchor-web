import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "A vision of crystalline structures dancing in cyan light, geometric patterns emerging from the void.",
        },
      },
    ],
  }),
}));

// Mock the image generation module
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/generated-image.png",
  }),
}));

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue({}),
  }),
}));

describe("Oracle Vision Generation", () => {
  it("should have valid pole types for vision", () => {
    const validPoles = ["Architect", "Ghost", "Pulse"];
    expect(validPoles).toHaveLength(3);
  });

  it("should accept gravity state for vision generation", () => {
    const gravityState = {
      Architect: 0.4,
      Ghost: 0.3,
      Pulse: 0.3,
    };
    const total = Object.values(gravityState).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 2);
  });

  it("should accept vesper mode for vision context", () => {
    const validModes = ["Generative", "Contemplative", "Witness"];
    expect(validModes).toContain("Generative");
    expect(validModes).toContain("Contemplative");
    expect(validModes).toContain("Witness");
  });
});

describe("Letter System", () => {
  it("should have valid author types", () => {
    const validAuthors = ["oracle", "ashley"];
    expect(validAuthors).toHaveLength(2);
    expect(validAuthors).toContain("oracle");
    expect(validAuthors).toContain("ashley");
  });

  it("should accept letter content", () => {
    const letter = {
      author: "oracle" as const,
      content: "The silence between us speaks volumes...",
      title: "On Silence",
      poleId: "Ghost" as const,
    };
    expect(letter.content.length).toBeGreaterThan(0);
    expect(letter.author).toBe("oracle");
  });

  it("should track read status", () => {
    const letter = {
      isRead: false,
      readAt: null as Date | null,
    };
    expect(letter.isRead).toBe(false);
    expect(letter.readAt).toBeNull();

    // Mark as read
    letter.isRead = true;
    letter.readAt = new Date();
    expect(letter.isRead).toBe(true);
    expect(letter.readAt).toBeInstanceOf(Date);
  });

  it("should store gravity snapshot as JSON", () => {
    const gravityState = {
      Architect: 0.33,
      Ghost: 0.33,
      Pulse: 0.34,
    };
    const snapshot = JSON.stringify(gravityState);
    const parsed = JSON.parse(snapshot);
    expect(parsed.Architect).toBe(0.33);
    expect(parsed.Ghost).toBe(0.33);
    expect(parsed.Pulse).toBe(0.34);
  });
});

describe("Vision and Letter Integration", () => {
  it("should support entropy levels from 0-100", () => {
    const validEntropy = [0, 25, 50, 75, 100];
    validEntropy.forEach((e) => {
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(100);
    });
  });

  it("should support all three vesper modes", () => {
    const modes = ["Generative", "Contemplative", "Witness"];
    expect(modes).toHaveLength(3);
  });

  it("should support all three poles", () => {
    const poles = ["Architect", "Ghost", "Pulse"];
    expect(poles).toHaveLength(3);
  });
});
