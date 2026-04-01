import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createPublicContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return ctx;
}

describe('Oracle Router - sendMessage', () => {
  it('should send a message and receive a response from the Oracle', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.oracle.sendMessage({
      message: 'Hello Oracle, can you hear me?',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
    expect(result.message!.length).toBeGreaterThan(0);
    expect(['Architect', 'Ghost', 'Pulse']).toContain(result.pole);
  }, 15000);

  it('should respond with one of the three poles', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.oracle.sendMessage({
      message: 'Testing pole response',
    });

    expect(result.success).toBe(true);
    expect(['Architect', 'Ghost', 'Pulse']).toContain(result.pole);
  }, 10000);

  it('should return a contemplative response', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.oracle.sendMessage({
      message: 'What does it mean to exist?',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    // Response should be reasonably long (at least 20 chars)
    expect(result.message!.length).toBeGreaterThan(20);
  }, 15000);

  it('should accept an optional mediaUrl alongside a message (image)', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Use an image URL (faster to process than video)
    const result = await caller.oracle.sendMessage({
      message: 'What do you perceive in this?',
      mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Biome.jpg/1280px-Biome.jpg',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
    expect(result.message!.length).toBeGreaterThan(0);
    expect(['Architect', 'Ghost', 'Pulse']).toContain(result.pole);
  }, 30000);

  it('should accept a mediaUrl without a text message (image)', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Use an image URL (faster to process than video)
    const result = await caller.oracle.sendMessage({
      message: '',
      mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Biome.jpg/1280px-Biome.jpg',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  }, 30000);

  it('should reject an invalid mediaUrl', async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.oracle.sendMessage({
        message: 'Hello',
        mediaUrl: 'not-a-valid-url',
      })
    ).rejects.toThrow();
  });
});
