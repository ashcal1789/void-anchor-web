export type RuntimeOrigin = "client" | "server";

export type RuntimeStatus =
  | "started"
  | "updated"
  | "completed"
  | "skipped"
  | "failed";

export type RuntimeEvent = {
  id: string;
  at: number;
  sessionId: string;
  origin: RuntimeOrigin;
  kind: string;
  status: RuntimeStatus;
  data: Record<string, unknown>;
};

export type RuntimeEventInput = Omit<
  RuntimeEvent,
  "id" | "at" | "sessionId" | "data"
> & {
  data?: Record<string, unknown>;
};

const sensitiveKey = /authorization|bearer|cookie|key|secret|token|password/i;

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? "[redacted]" : redactValue(item),
      ])
    );
  }

  return value;
}

export function createRuntimeSessionId(now = Date.now()): string {
  return `runtime-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRuntimeEvent(
  sessionId: string,
  input: RuntimeEventInput,
  now = Date.now()
): RuntimeEvent {
  return {
    id: `event-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: now,
    sessionId,
    origin: input.origin,
    kind: input.kind,
    status: input.status,
    data: (redactValue(input.data ?? {}) ?? {}) as Record<string, unknown>,
  };
}

export function appendRuntimeEvent(
  events: RuntimeEvent[],
  event: RuntimeEvent
): RuntimeEvent[] {
  return [...events, event];
}
