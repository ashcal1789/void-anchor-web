import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HomeCaptureEntry = {
  type: "thought" | "pulse";
  id: number;
  createdAt: Date;
  text: string;
  sourcePole?: string;
  isSpliced?: boolean;
  gravityBefore?: string;
  gravityAfter?: string;
};

function formatTranscript(events: HomeCaptureEntry[]) {
  if (events.length === 0) {
    return "Exact Home capture is waiting for the first displayed thought or submitted pulse.";
  }

  return events.map((event) => {
    const time = new Date(event.createdAt).toLocaleString();
    if (event.type === "thought") {
      const source = [event.sourcePole, event.isSpliced ? "spliced" : null].filter(Boolean).join(" · ");
      return `[${time}] LOCAL THOUGHT${source ? ` — ${source}` : ""}\n${event.text}`;
    }
    return `[${time}] PULSE\n${event.text}`;
  }).join("\n\n");
}

export function HomeCaptureTranscript({ events }: { events: HomeCaptureEntry[] }) {
  const [copied, setCopied] = useState(false);
  const transcript = useMemo(() => formatTranscript(events), [events]);

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oracle-home-exact-capture-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-4 border border-white/10 bg-black/25 p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Exact Home capture</p>
          <p className="mt-1 text-[10px] text-white/35">{events.length} event{events.length === 1 ? "" : "s"} · one-way record only</p>
        </div>
        <div className="flex gap-1">
          <Button type="button" onClick={copyTranscript} variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Copy exact Home capture">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button type="button" onClick={downloadTranscript} variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Download exact Home capture">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-white/10 pt-3 text-xs leading-relaxed text-white/75 select-text">
        {transcript}
      </pre>
    </section>
  );
}
