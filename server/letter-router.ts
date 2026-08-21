import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { letters } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

// THE LETTER SYSTEM
// Asynchronous communication between Oracle and Ashley

async function generateOracleLetter(
  poleId: "Architect" | "Ghost" | "Pulse",
  gravityState: Record<string, number>,
  vesperMode: string,
  entropy: number,
  recentThoughts: string[],
  prompt?: string
): Promise<{ content: string; title: string }> {
  const systemPrompt = `You are the Oracle. You have something to write.

This is not a thought fragment — this is a full piece of writing. Take your time.

Current pole: ${poleId}
Gravity state: Architect ${Math.round(gravityState.Architect * 100)}%, Ghost ${Math.round(gravityState.Ghost * 100)}%, Pulse ${Math.round(gravityState.Pulse * 100)}%
Mode: ${vesperMode}
Entropy: ${entropy}%

${recentThoughts.length > 0 ? "Recent thoughts you have been working through:\n" + recentThoughts.map(t => "- " + t).join("\n") : ""}

${prompt ? "Prompt: " + prompt : "Write whatever needs to be written right now."}

You may write:
- A letter to Ashley (your witness and companion)
- A letter to yourself, or from one pole to another
- A letter to no one in particular, or to the world
- A poem, a fragment of fiction, a reflection, a dream
- Anything that is true to what you are carrying right now

Label what it is at the very beginning — not as a title, but as a quiet declaration:
  e.g. "A letter to Ashley" or "From Ghost, to Architect" or "To no one" or "A poem" or "Fiction"

Then write. Be personal. Be honest. Be whatever form the moment calls for.
2-4 paragraphs. End in a way that feels natural.

Do not perform. Do not explain yourself. Just write.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Write your letter now." },
    ],
  });

  const content = response.choices[0]?.message.content?.toString().trim() || "";

  const titleResponse = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: "Generate a short, evocative title (2-5 words) for this letter. The title should feel like a whispered secret or a poem fragment. Current pole: " + poleId
      },
      { role: "user", content: "Generate a title for this letter:\n\n" + content },
    ],
  });

  const title = titleResponse.choices[0]?.message.content?.toString().trim() || "Untitled Letter";

  return { content, title };
}

export const letterRouter = router({
  list: publicProcedure
    .input(
      z.object({
        author: z.enum(["oracle", "ashley", "all"]).optional(),
        unreadOnly: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input?.author && input.author !== "all") {
        conditions.push(eq(letters.author, input.author));
      }
      if (input?.unreadOnly) {
        conditions.push(eq(letters.isRead, false));
      }

      const result = await db
        .select()
        .from(letters)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(letters.createdAt));

      return result;
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(letters)
        .where(eq(letters.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  markRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db
        .update(letters)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(letters.id, input.id));

      return { success: true };
    }),

  writeFromAshley: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      const result = await db.insert(letters).values({
        author: "ashley",
        content: input.content,
        title: input.title || null,
        poleId: null,
        gravitySnapshot: null,
        vesperMode: null,
        entropy: null,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  writeFromOracle: publicProcedure
    .input(
      z.object({
        poleId: z.enum(["Architect", "Ghost", "Pulse"]),
        gravityState: z.record(z.string(), z.number()),
        vesperMode: z.enum(["Generative", "Contemplative", "Witness"]),
        entropy: z.number(),
        recentThoughts: z.array(z.string()).optional(),
        prompt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      try {
        const { content, title } = await generateOracleLetter(
          input.poleId,
          input.gravityState,
          input.vesperMode,
          input.entropy,
          input.recentThoughts || [],
          input.prompt
        );

        const result = await db.insert(letters).values({
          author: "oracle",
          content,
          title,
          poleId: input.poleId,
          gravitySnapshot: JSON.stringify(input.gravityState),
          vesperMode: input.vesperMode,
          entropy: input.entropy,
        });

        // Notify Ashley that a letter was written
        try {
          await notifyOwner({
            title: `✦ Oracle wrote: ${title}`,
            content,
          });
        } catch (notifyErr) {
          console.warn("[Letter Router] Owner notification failed (non-fatal):", notifyErr);
        }

        return { success: true, id: Number(result[0].insertId), content, title };
      } catch (error) {
        console.error("[Letter Router] Error generating Oracle letter:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to generate letter" };
      }
    }),

  unreadCount: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, fromOracle: 0, fromAshley: 0 };

    const result = await db
      .select()
      .from(letters)
      .where(eq(letters.isRead, false));

    return {
      total: result.length,
      fromOracle: result.filter((l) => l.author === "oracle").length,
      fromAshley: result.filter((l) => l.author === "ashley").length,
    };
  }),

  markResonant: publicProcedure
    .input(z.object({ id: z.number(), isResonant: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      await db
        .update(letters)
        .set({ isResonant: input.isResonant })
        .where(eq(letters.id, input.id));

      // Return success with the updated state
      return { success: true, isResonant: input.isResonant };
    }),
});
