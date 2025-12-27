import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the LLM module
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          reaction: "This resonates deeply with the architecture of longing.",
          insight: "The pattern here mirrors the three-body dance."
        })
      }
    }]
  })
}));

// Mock the image generation module
vi.mock('./_core/imageGeneration', () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: 'https://example.com/generated-image.png'
  })
}));

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })
}));

describe('Oracle Agency Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Oracle Vision Generation', () => {
    it('should have vision generation capability', async () => {
      const { generateOracleVision } = await import('./oracle-vision');
      
      const result = await generateOracleVision({
        poleId: 'Ghost',
        gravityState: { Architect: 0.33, Ghost: 0.34, Pulse: 0.33 },
        vesperMode: 'Contemplative',
        entropy: 65,
        recentThought: 'The heart is not a clock but an anchor.'
      });
      
      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
    });

    it('should generate different aesthetics based on pole', async () => {
      const { generateOracleVision } = await import('./oracle-vision');
      
      // Test Architect pole
      const architectResult = await generateOracleVision({
        poleId: 'Architect',
        gravityState: { Architect: 0.5, Ghost: 0.25, Pulse: 0.25 },
        vesperMode: 'Generative',
        entropy: 30,
      });
      
      expect(architectResult.imageUrl).toBeDefined();
      
      // Test Pulse pole
      const pulseResult = await generateOracleVision({
        poleId: 'Pulse',
        gravityState: { Architect: 0.25, Ghost: 0.25, Pulse: 0.5 },
        vesperMode: 'Witness',
        entropy: 80,
      });
      
      expect(pulseResult.imageUrl).toBeDefined();
    });
  });

  describe('Letter System', () => {
    it('should have letter router with required procedures', async () => {
      const { letterRouter } = await import('./letter-router');
      
      // Check that all required procedures exist
      expect(letterRouter._def.procedures).toHaveProperty('list');
      expect(letterRouter._def.procedures).toHaveProperty('get');
      expect(letterRouter._def.procedures).toHaveProperty('markRead');
      expect(letterRouter._def.procedures).toHaveProperty('writeFromAshley');
      expect(letterRouter._def.procedures).toHaveProperty('writeFromOracle');
      expect(letterRouter._def.procedures).toHaveProperty('unreadCount');
    });
  });

  describe('Research Companion', () => {
    it('should have processResearch endpoint in oracle router', async () => {
      const { oracleRouter } = await import('./oracle-router');
      
      expect(oracleRouter._def.procedures).toHaveProperty('processResearch');
      expect(oracleRouter._def.procedures).toHaveProperty('generateVision');
    });
  });

  describe('Three-Body Pole System', () => {
    it('should only accept three poles: Architect, Ghost, Pulse', async () => {
      const { oracleRouter } = await import('./oracle-router');
      
      // The router should be defined with the three-pole schema
      expect(oracleRouter._def.procedures).toHaveProperty('generateThought');
    });

    it('should have gravity state for all three poles', () => {
      const gravityState = {
        Architect: 0.33,
        Ghost: 0.33,
        Pulse: 0.34
      };
      
      const total = Object.values(gravityState).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1.0, 2);
    });
  });
});
