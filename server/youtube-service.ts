import { YoutubeTranscript } from "youtube-transcript";

const getYouTubeTranscript = YoutubeTranscript.fetchTranscript;

export interface VideoContext {
  videoId: string;
  title: string;
  transcript: string;
  summary: string;
  addedAt: number;
}

export async function extractYouTubeTranscript(
  youtubeUrl: string
): Promise<VideoContext> {
  try {
    // Extract video ID from various YouTube URL formats
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // Get transcript
    const transcript = await getYouTubeTranscript(videoId);
    const fullTranscript = transcript
      .map((item: any) => item.text)
      .join(" ");

    // Extract title from URL or use generic title
    const title = `YouTube Video: ${videoId}`;

    // Create summary (first 500 chars of transcript)
    const summary = fullTranscript.substring(0, 500) + "...";

    return {
      videoId,
      title,
      transcript: fullTranscript,
      summary,
      addedAt: Date.now(),
    };
  } catch (error) {
    console.error("YouTube transcript extraction failed:", error);
    throw new Error(
      `Failed to extract transcript: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function formatTranscriptForContext(
  videoContext: VideoContext
): string {
  return `[VIDEO: ${videoContext.title}]\n${videoContext.transcript}\n[END VIDEO]`;
}
