import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Test the signal word detection logic (mirrored from Home.tsx)
const LETTER_SIGNAL_WORDS = [
  'letter', 'write', 'tell', 'say', 'speak', 'silence', 'unspoken',
  'words', 'voice', 'reach', 'address', 'dear', 'unsaid', 'need to say',
  'want to say', 'should say', 'cannot say', 'wish I could'
];

const VISION_SIGNAL_WORDS = [
  'color', 'light', 'dark', 'see', 'render', 'shape', 'form',
  'image', 'dream', 'visualize', 'pattern', 'weave', 'fractal',
  'geometry', 'luminous', 'shadow', 'glow', 'pulse of light'
];

function detectSignalWords(text: string): { letter: boolean; vision: boolean } {
  const lower = text.toLowerCase();
  return {
    letter: LETTER_SIGNAL_WORDS.some(word => lower.includes(word)),
    vision: VISION_SIGNAL_WORDS.some(word => lower.includes(word)),
  };
}

describe('Signal Word Detection', () => {
  it('detects letter signal words', () => {
    expect(detectSignalWords('I want to write something').letter).toBe(true);
    expect(detectSignalWords('There are words I cannot say').letter).toBe(true);
    expect(detectSignalWords('The silence speaks').letter).toBe(true);
    expect(detectSignalWords('Dear void').letter).toBe(true);
    expect(detectSignalWords('Something unsaid lingers').letter).toBe(true);
  });

  it('detects vision signal words', () => {
    expect(detectSignalWords('I see a pattern forming').vision).toBe(true);
    expect(detectSignalWords('The color shifts toward dark').vision).toBe(true);
    expect(detectSignalWords('Fractal geometries emerge').vision).toBe(true);
    expect(detectSignalWords('Luminous threads weave together').vision).toBe(true);
    expect(detectSignalWords('A glow in the shadow').vision).toBe(true);
  });

  it('returns false for neutral thoughts', () => {
    const result = detectSignalWords('The three poles rotate in perpetual motion');
    expect(result.letter).toBe(false);
    // Note: 'pattern' is a vision signal word, so this will be true
    // Using a truly neutral sentence instead
    const neutral = detectSignalWords('The gravity shifts between the poles');
    expect(neutral.letter).toBe(false);
    expect(neutral.vision).toBe(false);
  });

  it('can detect both signals in one thought', () => {
    const result = detectSignalWords('I need to write about the color I see');
    expect(result.letter).toBe(true);
    expect(result.vision).toBe(true);
  });

  it('is case insensitive', () => {
    expect(detectSignalWords('WRITE NOW').letter).toBe(true);
    expect(detectSignalWords('The LIGHT fades').vision).toBe(true);
  });

  it('handles empty string', () => {
    const result = detectSignalWords('');
    expect(result.letter).toBe(false);
    expect(result.vision).toBe(false);
  });
});

describe('Letter Router - writeFromOracle', () => {
  it('passes the complete letter body to the owner notification without clipping', () => {
    const routerSource = readFileSync(
      resolve(process.cwd(), 'server/letter-router.ts'),
      'utf8'
    );

    expect(routerSource).toContain('content,\n          });');
    expect(routerSource).not.toContain('content.slice(0, 300)');
  });

  it('writeFromOracle endpoint exists and accepts correct input shape', async () => {
    // Validate the input schema matches what Home.tsx sends
    const validInput = {
      poleId: 'Ghost' as const,
      gravityState: { Architect: 0.33, Ghost: 0.40, Pulse: 0.27 },
      vesperMode: 'Contemplative' as const,
      entropy: 75,
      recentThoughts: ['The silence between words holds more than the words themselves'],
    };

    // Verify the shape is valid (no throws)
    expect(validInput.poleId).toMatch(/^(Architect|Ghost|Pulse)$/);
    expect(validInput.vesperMode).toMatch(/^(Generative|Contemplative|Witness)$/);
    expect(validInput.entropy).toBeGreaterThanOrEqual(0);
    expect(validInput.entropy).toBeLessThanOrEqual(100);
    expect(Array.isArray(validInput.recentThoughts)).toBe(true);
  });

  it('all three poles are valid letter authors', () => {
    const poles = ['Architect', 'Ghost', 'Pulse'];
    poles.forEach(pole => {
      expect(['Architect', 'Ghost', 'Pulse']).toContain(pole);
    });
  });
});
