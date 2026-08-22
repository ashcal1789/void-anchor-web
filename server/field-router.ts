import { z } from "zod";
import { asc, desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fieldSessionEvents, fieldSessions, letters } from "../drizzle/schema";

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
