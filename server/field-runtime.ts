import { ChaosEngineLiberated, type PoleId, type Thought } from "../client/src/lib/chaos-engine-liberated";
import { LocalInvitationActionProtocol } from "../client/src/lib/local-invitation-action-protocol";

export type FieldRuntimeState = {
  runtimeId: string;
  sequence: number;
  thought: Thought | null;
  poles: Record<PoleId, number>;
  vesperMode: string;
  entropy: number;
  heartbeatMs: number | null;
  lastUpdatedAt: number | null;
  modelUsed: "none";
};

export type FieldRuntimeEvent = {
  sequence: number;
  type: "thought" | "pulse" | "runtime";
  createdAt: number;
  thought?: Thought;
  data?: Record<string, unknown>;
};

export class ServerFieldRuntime {
  private readonly runtimeId = `server-field-${Date.now()}`;
  private readonly engine: ChaosEngineLiberated;
  private readonly actionProtocol: LocalInvitationActionProtocol;
  private readonly events: FieldRuntimeEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sequence = 0;
  private thought: Thought | null = null;
  private heartbeatMs: number | null = null;
  private lastUpdatedAt: number | null = null;
  private started = false;
  private historyOpeningOffered = false;

  constructor() {
    this.actionProtocol = new LocalInvitationActionProtocol({
      runtimeId: this.runtimeId,
      eventSink: (event) => {
        this.append({
          type: "runtime",
          createdAt: event.at,
          data: { eventType: event.type, event, modelUsed: "none" },
        });
      },
    });
    this.actionProtocol.registerTool({
      descriptor: {
        id: "history.read.local",
        capability: "read",
        description: "Read a selected portion of the Field's prior shadow thoughts.",
        available: true,
        requiresWitnessConfirmation: false,
      },
      execute: async (context) => ({
        toolId: "history.read.local",
        startedAt: context.observation.now,
        completedAt: Date.now(),
        status: "completed",
        output: this.readOwnHistory(100),
        externalProvider: "JSONBin shadow",
        modelUsed: "none",
      }),
    });
    this.engine = new ChaosEngineLiberated({
      enableShadowSync: true,
      onRuntimeEvent: (event) => {
        this.append({
          type: "runtime",
          createdAt: Date.now(),
          data: {
            kind: event.kind,
            status: event.status,
            data: event.data,
            modelUsed: "none",
          },
        });
      },
    });
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.advance();
    void this.engine.whenShadowReady().then(() => this.offerHistoryOpening());
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.started = false;
  }

  current(): FieldRuntimeState {
    const state = this.engine.getState();
    return {
      runtimeId: this.runtimeId,
      sequence: this.sequence,
      thought: this.thought,
      poles: { ...state.poles },
      vesperMode: this.engine.getVesperMode(),
      entropy: this.engine.getInternalEntropy(),
      heartbeatMs: this.heartbeatMs,
      lastUpdatedAt: this.lastUpdatedAt,
      modelUsed: "none",
    };
  }

  eventsSince(afterSequence = 0): FieldRuntimeEvent[] {
    return this.events.filter((event) => event.sequence > afterSequence).slice(-100);
  }

  readOwnHistory(limit = 100) {
    const shadow = this.engine.getState().shadow;
    return shadow.slice(-Math.max(1, Math.min(limit, 500))).map((thought) => ({ ...thought }));
  }

  shadowStatus() {
    return {
      available: true,
      connected: this.engine.isConnected,
      count: this.engine.getState().shadow.length,
      automaticInjection: false,
      modelUsed: "none" as const,
    };
  }

  receivePulse(input: string): FieldRuntimeState {
    this.engine.sendPulse(input);
    this.append({
      type: "pulse",
      createdAt: Date.now(),
      data: {
        input,
        poles: { ...this.engine.getState().poles },
        modelUsed: "none",
      },
    });
    return this.current();
  }

  private advance(): void {
    this.thought = this.engine.getOracleThought();
    this.engine.exhaleSurvivor(this.thought);
    this.heartbeatMs = this.engine.getHeartbeat();
    this.lastUpdatedAt = Date.now();
    this.append({
      type: "thought",
      createdAt: this.lastUpdatedAt,
      thought: this.thought,
      data: {
        poles: { ...this.engine.getState().poles },
        vesperMode: this.engine.getVesperMode(),
        entropy: this.engine.getInternalEntropy(),
        heartbeatMs: this.heartbeatMs,
        modelUsed: "none",
      },
    });
    this.timer = setTimeout(() => this.advance(), this.heartbeatMs);
  }

  private offerHistoryOpening(): void {
    if (this.historyOpeningOffered) return;
    this.historyOpeningOffered = true;
    this.actionProtocol.offerInvitation({
      id: "history-opening",
      source: "local-condition",
      createdAt: Date.now(),
      toolId: "history.read.local",
      text: "Prior Field material is available for one optional opening.",
    });
    void this.actionProtocol.runCycle().then((outcome) => {
      if (outcome.kind !== "use-tool" || outcome.toolId !== "history.read.local") return;
      const result = outcome.toolResult;
      if (!result || result.status !== "completed") return;
      this.append({
        type: "runtime",
        createdAt: Date.now(),
        data: {
          eventType: "expression.encountered",
          expressionType: "prior-field-history",
          content: result.output,
          modelUsed: "none",
        },
      });
    });
  }

  private append(event: Omit<FieldRuntimeEvent, "sequence">): void {
    this.sequence += 1;
    this.events.push({ ...event, sequence: this.sequence });
    if (this.events.length > 200) this.events.shift();
  }
}

export const serverFieldRuntime = new ServerFieldRuntime();
