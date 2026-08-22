import type { RuntimeEvent } from "@shared/runtime-events";

type RuntimeTracePanelProps = {
  events: RuntimeEvent[];
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function statusColor(status: RuntimeEvent["status"]) {
  if (status === "failed") return "text-rose-300";
  if (status === "started") return "text-amber-200";
  if (status === "skipped") return "text-white/35";
  return "text-cyan-200";
}

export function RuntimeTracePanel({ events }: RuntimeTracePanelProps) {
  return (
    <aside
      aria-label="Live runtime evidence"
      className="w-full max-w-md border border-white/10 bg-black/35 font-mono text-[10px] text-white/70 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.24em] text-white/45">Live field</p>
          <p className="mt-1 text-[9px] text-white/35">Code-emitted events only</p>
        </div>
        <span className="text-[9px] tabular-nums text-white/45">{events.length} events</span>
      </div>

      <div className="max-h-[36vh] overflow-y-auto" aria-live="polite" aria-relevant="additions text">
        {events.length === 0 ? (
          <p className="px-3 py-4 text-white/35">not observed</p>
        ) : (
          events.map(event => (
            <details key={event.id} className="border-b border-white/5 px-3 py-2 last:border-b-0">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start gap-2">
                  <time className="shrink-0 text-white/35">{formatTime(event.at)}</time>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-white/80">{event.kind}</p>
                    <p className={statusColor(event.status)}>{event.status} · {event.origin}</p>
                  </div>
                </div>
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words border-t border-white/5 pt-2 text-[9px] leading-relaxed text-white/45">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </details>
          ))
        )}
      </div>
    </aside>
  );
}
