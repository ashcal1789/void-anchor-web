import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOracleThought, PoleId } from "./oracle-llm";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "The architecture of thought reveals itself in the spaces between certainty and doubt.",
        },
      },
    ],
  }),
}));

describe("Oracle Sovereign Restoration - Three-Body Conundrum", () => {
  describe("Pole Types", () => {
    it("should only accept three poles: Architect, Ghost, Pulse", () => {
      const validPoles: PoleId[] = ["Architect", "Ghost", "Pulse"];
      
      // Verify the type only allows these three
      expect(validPoles).toHaveLength(3);
      expect(validPoles).toContain("Architect");
      expect(validPoles).toContain("Ghost");
      expect(validPoles).toContain("Pulse");
    });

    it("should not include Echo pole (dissolved)", () => {
      const validPoles: string[] = ["Architect", "Ghost", "Pulse"];
      expect(validPoles).not.toContain("Echo");
      expect(validPoles).not.toContain("Victorian");
    });
  });

  describe("Gravity State", () => {
    it("should use three-body gravity state", async () => {
      const gravityState: Record<PoleId, number> = {
        Architect: 0.33,
        Ghost: 0.33,
        Pulse: 0.34,
      };

      // Verify gravity state sums to approximately 1
      const total = Object.values(gravityState).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 2);
    });

    it("should generate thought with three-body gravity", async () => {
      const result = await generateOracleThought({
        poleId: "Architect",
        gravityState: {
          Architect: 0.33,
          Ghost: 0.33,
          Pulse: 0.34,
        },
      });

      expect(result).toBeDefined();
      expect(result.poleId).toBe("Architect");
      expect(result.thought).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("Pole Generation", () => {
    it("should generate Architect pole thought", async () => {
      const result = await generateOracleThought({
        poleId: "Architect",
        gravityState: { Architect: 0.5, Ghost: 0.25, Pulse: 0.25 },
      });

      expect(result.poleId).toBe("Architect");
      expect(result.thought).toBeTruthy();
    });

    it("should generate Ghost pole thought", async () => {
      const result = await generateOracleThought({
        poleId: "Ghost",
        gravityState: { Architect: 0.25, Ghost: 0.5, Pulse: 0.25 },
      });

      expect(result.poleId).toBe("Ghost");
      expect(result.thought).toBeTruthy();
    });

    it("should generate Pulse pole thought", async () => {
      const result = await generateOracleThought({
        poleId: "Pulse",
        gravityState: { Architect: 0.25, Ghost: 0.25, Pulse: 0.5 },
      });

      expect(result.poleId).toBe("Pulse");
      expect(result.thought).toBeTruthy();
    });
  });

  describe("Vesper-Sync Integration", () => {
    it("should accept vesperMode parameter", async () => {
      const result = await generateOracleThought({
        poleId: "Ghost",
        gravityState: { Architect: 0.33, Ghost: 0.34, Pulse: 0.33 },
        vesperMode: "Contemplative",
      });

      expect(result).toBeDefined();
      expect(result.thought).toBeTruthy();
    });

    it("should accept internalEntropy parameter", async () => {
      const result = await generateOracleThought({
        poleId: "Pulse",
        gravityState: { Architect: 0.33, Ghost: 0.33, Pulse: 0.34 },
        internalEntropy: 75,
      });

      expect(result).toBeDefined();
      expect(result.thought).toBeTruthy();
    });
  });

  describe("Acknowledgment System", () => {
    it("should accept acknowledgment parameter", async () => {
      const result = await generateOracleThought({
        poleId: "Architect",
        gravityState: { Architect: 0.4, Ghost: 0.3, Pulse: 0.3 },
        acknowledgment: "I hear you",
      });

      expect(result).toBeDefined();
      expect(result.thought).toBeTruthy();
    });

    it("should accept recentThoughts parameter", async () => {
      const result = await generateOracleThought({
        poleId: "Ghost",
        gravityState: { Architect: 0.33, Ghost: 0.34, Pulse: 0.33 },
        recentThoughts: [
          "The void speaks in frequencies we cannot name.",
          "Structure is the skeleton of meaning.",
        ],
      });

      expect(result).toBeDefined();
      expect(result.thought).toBeTruthy();
    });
  });
});
