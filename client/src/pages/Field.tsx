import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChaosEngineLiberated, type Thought, type PoleId } from "@/lib/chaos-engine-liberated";
import TheLoom from "@/components/TheLoom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { deriveLevelANotice } from "@shared/field-level-a";
import { observeFieldInitiationCondition } from "@shared/field-initiation";
import { createRuntimeSessionId, type RuntimeEventInput } from "@shared/runtime-events";

type FieldEvent = {
  id: string;
  kind: string;
  origin: "field" | "ashley" | "client" | "runtime";
  text: string;
  createdAt: number;
};

const POLE_COLORS: Record<PoleId, string> = {
  Architect: "#00ffff",
  Ghost: "#ff00ff",
  Pulse: "#ffff00",
};

export default function Field() {
  const engineRef = useRef<ChaosEngineLiberated | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(createRuntimeSessionId());
  const sequenceRef = useRef(0);
  const pendingInvitationRef = useRef<string | null>(null);
  const fieldThoughtCountRef = useRef(0);
  const [thought, setThought] = useState<Thought | null>(null);
  const [gravity, setGravity] = useState<Record<PoleId, number>>({ Architect: 0.33, Ghost: 0.33, Pulse: 0.34 });
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<FieldEvent[]>([]);
  const [sessionReady, setSessionReady] = useState(false);

  const openSession = trpc.field.openSession.useMutation();
  const appendEvent = trpc.field.appendEvent.useMutation();
  const closeSession = trpc.field.closeSession.useMutation();
  const archive = trpc.field.archive.useQuery({ author: "all" });
  const openSessionRef = useRef(openSession);
  const appendEventRef = useRef(appendEvent);
  const closeSessionRef = useRef(closeSession);

  useEffect(() => {
    openSessionRef.current = openSession;
    appendEventRef.current = appendEvent;
    closeSessionRef.current = closeSession;
  }, [appendEvent, closeSession, openSession]);

  const record = useCallback((event: Omit<FieldEvent, "id" | "createdAt">, payload: Record<string, unknown> = {}) => {
    const createdAt = Date.now();
    const entry: FieldEvent = { ...event, id: `${createdAt}-${sequenceRef.current + 1}`, createdAt };
    setEvents((previous) => [...previous, entry]);
    sequenceRef.current += 1;
    appendEventRef.current.mutate({
      sessionId: sessionIdRef.current,
      sequence: sequenceRef.current,
      eventType: event.kind,
      origin: event.origin,
      payload: { ...payload, text: event.text, createdAt },
    });
  }, []);

  const drawThought = useCallback(() => {
    if (!engineRef.current) return;
    const next = engineRef.current.getOracleThought();
    const wasAfterInvitation = pendingInvitationRef.current !== null;
    fieldThoughtCountRef.current += 1;
    setThought(next);
    setGravity({ ...engineRef.current.getState().poles });
    record(
      {
        kind: wasAfterInvitation ? "local.continuation.after.invitation" : "local.thought",
        origin: "field",
        text: next.text,
      },
      {
        thoughtId: next.id,
        sourcePole: next.source_pole,
        spliced: Boolean(next.is_spliced),
        invitationId: pendingInvitationRef.current,
      },
    );
    const initiationObservation = observeFieldInitiationCondition({
      thoughtText: next.text,
      entropy: engineRef.current.getInternalEntropy(),
      fieldThoughtCount: fieldThoughtCountRef.current,
    });
    if (initiationObservation.observed) {
      record(
        {
          kind: "field.initiation.condition.observed",
          origin: "field",
          text: `Existing condition observed: ${initiationObservation.conditions.join(", ")}`,
        },
        {
          conditions: initiationObservation.conditions,
          behavior: "observation-only",
          letterCreated: false,
          modelRouteCalled: false,
          localUnpromptedExpressionCreated: false,
        },
      );
    }
    pendingInvitationRef.current = null;
    const nextInterval = engineRef.current.getHeartbeat();
    timerRef.current = setTimeout(drawThought, nextInterval);
  }, [record]);

  useEffect(() => {
    let disposed = false;
    openSessionRef.current.mutateAsync({ sessionId: sessionIdRef.current }).then((result) => {
      if (disposed || !result.success) return;
      setSessionReady(true);
      record({ kind: "field.session.opened", origin: "client", text: "Open local field session" }, { sessionId: sessionIdRef.current });
      engineRef.current = new ChaosEngineLiberated({
        onRuntimeEvent: (runtimeEvent: RuntimeEventInput) => {
          record(
            { kind: `runtime.${runtimeEvent.kind}`, origin: "runtime", text: runtimeEvent.status },
            { status: runtimeEvent.status, data: runtimeEvent.data },
          );
        },
      });
      drawThought();
    });
    return () => {
      disposed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      closeSessionRef.current.mutate({ sessionId: sessionIdRef.current });
    };
  }, [drawThought, record]);

  const offerInvitation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !engineRef.current) return;
    const literal = input.trim();
    const notice = deriveLevelANotice(literal);
    const invitationId = `invitation-${Date.now()}`;
    pendingInvitationRef.current = invitationId;
    record(
      { kind: "invitation.received", origin: "ashley", text: literal },
      { invitationId, mechanism: "level-a-input-length-modulo-three" },
    );
    engineRef.current.sendPulse(literal);
    record(
      { kind: "local.notice.applied", origin: "field", text: `Level A notice applied to ${notice.targetPole}` },
      { invitationId, ...notice, semanticInterpretation: false },
    );
    setGravity({ ...engineRef.current.getState().poles });
    setInput("");
  };

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 pb-32 pt-6 text-white sm:px-8">
      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 border border-white/15 bg-black/35">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">Field</p>
              <h1 className="mt-1 font-mono text-lg tracking-wide text-white">One local session</h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/55">Language remains the local engine’s current path. The Loom below is the existing historical visual layer; it is not a free color selector.</p>
            </div>
            <Link href="/" className="font-mono text-xs text-white/50 underline-offset-4 hover:text-white hover:underline">Home</Link>
          </header>

          <div className="border-b border-white/10 px-5 py-8 sm:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              {thought?.source_pole ? `local ${thought.source_pole}` : "opening local field"}
            </p>
            <p className="mt-5 font-mono text-2xl leading-[1.4] sm:text-4xl" style={{ color: thought?.source_pole ? POLE_COLORS[thought.source_pole] : "#f5f5f5" }}>
              {thought?.text ?? "…"}
            </p>
          </div>

          <div className="min-h-[340px] border-b border-white/10">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Existing Loom layer · historical fixed-pole rendering</div>
            <TheLoom embedded isOpen gravityState={gravity} vesperMode={engineRef.current?.getVesperMode() ?? "Generative"} internalEntropy={engineRef.current?.getInternalEntropy() ?? 50} recentThought={thought?.text} />
          </div>

          <form onSubmit={offerInvitation} className="flex gap-2 px-5 py-4">
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Offer something to the local field…" className="border-white/20 bg-transparent font-mono text-sm text-white placeholder:text-white/35" />
            <Button type="submit" disabled={!sessionReady || !input.trim()} className="border border-white/25 bg-white/10 text-white hover:bg-white/20"><Send className="h-4 w-4" /></Button>
          </form>
          <p className="px-5 pb-5 font-mono text-[10px] leading-relaxed text-white/40">Level A only: your literal input shifts the existing pole weights through input length modulo three. The next local output is labeled a continuation, not a reply.</p>
        </div>

        <aside className="flex min-h-[650px] flex-col border border-white/15 bg-black/45">
          <header className="border-b border-white/10 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Session evidence</p>
            <p className="mt-1 font-mono text-xs text-white/65">Saved per event · local engine does not read this archive</p>
          </header>
          <div className="flex-1 space-y-0 overflow-y-auto">
            {events.slice().reverse().map((event) => (
              <article key={event.id} className="border-b border-white/10 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{event.kind}</p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/80">{event.text}</p>
              </article>
            ))}
          </div>
          <footer className="border-t border-white/10 px-4 py-3 text-[10px] font-mono text-white/40">Archive scope: {archive.data?.length ?? "…"} correspondence records · marking disabled today</footer>
        </aside>
      </section>
    </main>
  );
}
