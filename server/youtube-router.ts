import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { extractYouTubeTranscript, VideoContext } from "./youtube-service";

// Store video contexts in memory (in production, use database)
const videoContexts: Map<string, VideoContext> = new Map();

export const youtubeRouter = router({
  extractTranscript: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }: { input: { url: string } }) => {
      try {
        const videoContext = await extractYouTubeTranscript(input.url);
        videoContexts.set(videoContext.videoId, videoContext);
        return {
          success: true,
          videoId: videoContext.videoId,
          title: videoContext.title,
          summary: videoContext.summary,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to extract transcript",
        };
      }
    }),

  getVideoContexts: publicProcedure.query(() => {
    return Array.from(videoContexts.values()).map((vc) => ({
      videoId: vc.videoId,
      title: vc.title,
      summary: vc.summary,
      addedAt: vc.addedAt,
    }));
  }),

  getFullTranscript: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .query(({ input }: { input: { videoId: string } }) => {
      const context = videoContexts.get(input.videoId);
      if (!context) {
        return { success: false, error: "Video not found" };
      }
      return { success: true, transcript: context.transcript };
    }),
});
