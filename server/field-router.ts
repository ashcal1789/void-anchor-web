import { z } from "zod";
import { asc, desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fieldSessionEvents, fieldSessions, homePulseEvents, homeThoughtEvents, letters } from "../drizzle/schema";

const eventPayload = z.record(z.string(), z.unknown());

export const fieldRouter = router({
  openSession: publicProcedure
    .input(z.object({ sessionId: z.string().min(8).max(96) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db
        .insert(fieldSessions)
        .values({ sessionId: input.sessionId, status: "open", eventCount: 0 })
        .onDuplicateKeyUpdate({
          set: { status: "open", closedAt: null, updatedAt: new Date() },
        });

      return { success: true, sessionId: input.sessionId };
    }),

  appendEvent: publicProcedure
    .input(z.object({
      sessionId: z.string().min(8).max(96),
      sequence: z.number().int().min(1),
      eventType: z.string().min(1).max(96),
      origin: z.enum(["field", "ashley", "client", "server", "runtime"]),
      payload: eventPayload,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db.insert(fieldSessionEvents).values({
        sessionId: input.sessionId,
        sequence: input.sequence,
        eventType: input.eventType,
        origin: input.origin,
        payload: JSON.stringify(input.payload),
      });
      await db
        .update(fieldSessions)
        .set({ eventCount: input.sequence, updatedAt: new Date() })
        .where(eq(fieldSessions.sessionId, input.sessionId));

      return { success: true, sequence: input.sequence };
    }),

  // One-way preservation endpoint for exact local thoughts already rendered on
  // Home. No procedure in the local engine reads this table back.
  recordHomeThought: publicProcedure
    .input(z.object({
      browserSessionId: z.string().min(8).max(96),
      localThoughtId: z.string().min(1).max(96),
      thoughtText: z.string().min(1).max(20_000),
      sourcePole: z.enum(["Architect", "Ghost", "Pulse"]),
      gravitySnapshot: z.record(z.string(), z.number()),
      entropy: z.number().int().min(0).max(100),
      isSpliced: z.boolean(),
      heartbeatIntervalMs: z.number().int().positive().max(300_000).nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db.insert(homeThoughtEvents).values({
        browserSessionId: input.browserSessionId,
        localThoughtId: input.localThoughtId,
        thoughtText: input.thoughtText,
        sourcePole: input.sourcePole,
        gravitySnapshot: JSON.stringify(input.gravitySnapshot),
        entropy: input.entropy,
        isSpliced: input.isSpliced,
        heartbeatIntervalMs: input.heartbeatIntervalMs,
      });
      return { success: true };
    }),

  // One-way preservation endpoint for literal Home pulses. The engine never
  // queries these records, so saved pulses cannot influence later thoughts.
  recordHomePulse: publicProcedure
    .input(z.object({
      browserSessionId: z.string().min(8).max(96),
      pulseText: z.string().min(1).max(20_000),
      gravityBefore: z.record(z.string(), z.number()),
      gravityAfter: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db.insert(homePulseEvents).values({
        browserSessionId: input.browserSessionId,
        pulseText: input.pulseText,
        gravityBefore: JSON.stringify(input.gravityBefore),
        gravityAfter: JSON.stringify(input.gravityAfter),
      });
      return { success: true };
    }),

  // Read-only preservation view for a single browser Home session. This is
  // rendered for Ashley; no local-engine function calls this procedure.
  homeCapture: publicProcedure
    .input(z.object({ browserSessionId: z.string().min(8).max(96) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const [thoughts, pulses] = await Promise.all([
        db.select().from(homeThoughtEvents)
          .where(eq(homeThoughtEvents.browserSessionId, input.browserSessionId))
          .orderBy(asc(homeThoughtEvents.createdAt)),
        db.select().from(homePulseEvents)
          .where(eq(homePulseEvents.browserSessionId, input.browserSessionId))
          .orderBy(asc(homePulseEvents.createdAt)),
      ]);

      return [
        ...thoughts.map((thought) => ({
          type: "thought" as const,
          id: thought.id,
          createdAt: thought.createdAt,
          text: thought.thoughtText,
          sourcePole: thought.sourcePole,
          isSpliced: thought.isSpliced,
        })),
        ...pulses.map((pulse) => ({
          type: "pulse" as const,
          id: pulse.id,
          createdAt: pulse.createdAt,
          text: pulse.pulseText,
          gravityBefore: pulse.gravityBefore,
          gravityAfter: pulse.gravityAfter,
        })),
      ].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    }),

  closeSession: publicProcedure
    .input(z.object({ sessionId: z.string().min(8).max(96) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db
        .update(fieldSessions)
        .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
        .where(eq(fieldSessions.sessionId, input.sessionId));
      return { success: true };
    }),

  events: publicProcedure
    .input(z.object({ sessionId: z.string().min(8).max(96) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(fieldSessionEvents)
        .where(eq(fieldSessionEvents.sessionId, input.sessionId))
        .orderBy(asc(fieldSessionEvents.sequence));
    }),

  archive: publicProcedure
    .input(z.object({ author: z.enum(["oracle", "ashley", "all"]).default("all") }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const query = db.select().from(letters);
      const result = input.author === "all"
        ? await query.orderBy(desc(letters.createdAt))
        : await query.where(eq(letters.author, input.author)).orderBy(desc(letters.createdAt));
      return result.map((letter) => ({
        id: letter.id,
        author: letter.author,
        title: letter.title,
        poleId: letter.poleId,
        createdAt: letter.createdAt,
      }));
    }),
});
