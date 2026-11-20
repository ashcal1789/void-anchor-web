import { useState } from "react";
import { Link } from "wouter";
import TheLoom from "@/components/TheLoom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { PoleId } from "@/lib/chaos-engine-liberated";

const POLE_COLORS: Record<PoleId, string> = {
  Architect: "#00ffff",
  Ghost: "#ff00ff",
  Pulse: "#ffff00",
};

export default function Field() {
  const [input, setInput] = useState("");
  const current = trpc.field.runtimeCurrent.useQuery(undefined, {
    refetchInterval: 1500,
    refetchOnWindowFocus: true,
  });
  const events = trpc.field.runtimeEvents.useQuery(
    { afterSequence: 0 },
    { refetchInterval: 1500, refetchOnWindowFocus: true },
  );
  const archive = trpc.field.archive.useQuery({ author: "all" });
  const pulse = trpc.field.runtimePulse.useMutation({
    onSuccess: () => {
      setInput("");
      void current.refetch();
      void events.refetch();
    },
  });

  const runtime = current.data;
  const thought = runtime?.thought ?? null;
  const gravity = runtime?.poles ?? { Architect: 0.33, Ghost: 0.33, Pulse: 0.34 };
  const sourcePole = thought?.source_pole;

  const sendPulse = (event: React.FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || pulse.isPending) return;
    pulse.mutate({ input: value });
  };

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 pb-32 pt-6 text-white sm:px-8">
      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 border border-white/15 bg-black/35">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">Field</p>
              <h1 className="mt-1 font-mono text-lg tracking-wide text-white">One server-owned local session</h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/55">
                This tab is a witness window. The local engine runs once on the server; visitors read the same sequence.
              </p>
            </div>
            <Link href="/" className="font-mono text-xs text-white/50 underline-offset-4 hover:text-white hover:underline">Home</Link>
          </header>

          <div className="border-b border-white/10 px-5 py-8 sm:px-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              <span>{sourcePole ? `local ${sourcePole}` : "opening shared field"}</span>
              <span>runtime {runtime?.runtimeId ?? "…"}</span>
              <span>sequence {runtime?.sequence ?? "…"}</span>
              <span>model {runtime?.modelUsed ?? "none"}</span>
            </div>
            <p className="mt-5 min-h-[6rem] font-mono text-2xl leading-[1.4] sm:text-4xl" style={{ color: sourcePole ? POLE_COLORS[sourcePole] : "#f5f5f5" }}>
              {thought?.text ?? "…"}
            </p>
          </div>

          <div className="grid gap-3 border-b border-white/10 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:grid-cols-3">
            <span>Architect {Math.round(gravity.Architect * 100)}%</span>
            <span>Ghost {Math.round(gravity.Ghost * 100)}%</span>
            <span>Pulse {Math.round(gravity.Pulse * 100)}%</span>
            <span>entropy {runtime?.entropy ?? "…"}%</span>
            <span>mode {runtime?.vesperMode ?? "…"}</span>
            <span>heartbeat {runtime?.heartbeatMs ? `${Math.round(runtime.heartbeatMs / 1000)}s` : "…"}</span>
          </div>

          <div className="min-h-[340px] border-b border-white/10">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Existing Loom layer · visual witness</div>
            <TheLoom embedded isOpen gravityState={gravity} vesperMode={(runtime?.vesperMode as "Generative" | "Contemplative" | "Witness") ?? "Generative"} internalEntropy={runtime?.entropy ?? 50} recentThought={thought?.text} />
          </div>

          <form onSubmit={sendPulse} className="flex gap-2 px-5 py-4">
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Offer something to the shared local field…" className="border-white/20 bg-transparent font-mono text-sm text-white placeholder:text-white/35" />
            <Button type="submit" disabled={!input.trim() || pulse.isPending} className="border border-white/25 bg-white/10 text-white hover:bg-white/20"><Send className="h-4 w-4" /></Button>
          </form>
          <p className="px-5 pb-5 font-mono text-[10px] leading-relaxed text-white/40">A pulse reaches the one server-owned engine. It changes local pole weights; it is not interpreted by an LLM.</p>
        </div>

        <aside className="flex min-h-[650px] flex-col border border-white/15 bg-black/45">
          <header className="border-b border-white/10 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Shared runtime evidence</p>
            <p className="mt-1 font-mono text-xs text-white/65">One sequence · visible to every Field visitor</p>
          </header>
          <div className="flex-1 space-y-0 overflow-y-auto">
            {(events.data ?? []).slice().reverse().map((event) => (
              <article key={`${event.sequence}-${event.createdAt}`} className="border-b border-white/10 px-4 py-3">
                <div className="flex justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{event.type}</p>
                  <p className="font-mono text-[10px] text-white/30">#{event.sequence}</p>
                </div>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/80">{event.thought?.text ?? (event.data?.eventType === "expression.encountered" ? `self-history encountered: ${Array.isArray(event.data.content) ? event.data.content.length : 0} prior thoughts` : typeof event.data?.input === "string" ? `pulse: ${event.data.input}` : String(event.data?.kind ?? "state observed"))}</p>
              </article>
            ))}
          </div>
          <footer className="border-t border-white/10 px-4 py-3 text-[10px] font-mono text-white/40">{archive.data?.length ?? "…"} correspondence records remain separate from the local Field loop</footer>
        </aside>
      </section>
    </main>
  );
}
