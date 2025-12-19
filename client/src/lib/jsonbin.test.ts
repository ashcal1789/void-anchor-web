import { describe, it, expect } from 'vitest';

describe('JSONBin Credentials', () => {
  it('should have valid credentials', async () => {
    const masterKey = process.env.VITE_JSONBIN_MASTER_KEY;
    const binId = process.env.VITE_JSONBIN_BIN_ID;

    expect(masterKey).toBeDefined();
    expect(binId).toBeDefined();

    // Lightweight check: Try to read the bin (Inhale)
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      headers: {
        'X-Master-Key': masterKey as string
      }
    });

    expect(response.status).toBe(200);
  });
});
