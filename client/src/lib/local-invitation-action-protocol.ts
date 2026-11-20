/**
 * Local Invitation and Action Protocol
 *
 * DESIGN DRAFT — NOT CONNECTED TO Void Anchor.
 *
 * Purpose:
 *   Provide a non-LLM local action-selection loop with explicit, observable
 *   alternatives: continue locally, use a tool, decline, defer, or remain
 *   silent.
 *
 * Non-goals:
 *   - This does not claim consciousness or human-like free will.
 *   - This does not assign identity to Architect, Ghost, or Pulse.
 *   - This does not call an LLM, infer user intent, or impose a success goal.
 *   - This does not automatically feed archive material back into state.
 */

// -----------------------------------------------------------------------------
// Primitive types
// -----------------------------------------------------------------------------

export type PoleId = "Architect" | "Ghost" | "Pulse";

export type LocalMode = "Generative" | "Contemplative" | "Witness";

export type Origin =
  | "local"
  | "witness"
  | "external-collaborator"
  | "system";

export type ActionKind =
  | "continue-local"
  | "use-tool"
  | "decline"
  | "defer"
  | "silence"
  | "do-nothing";

export type ToolCapability =
  | "read"
  | "write"
  | "create"
  | "communicate"
  | "observe"
  | "play";

export type ToolExecutionStatus =
  | "completed"
  | "failed"
  | "empty"
  | "declined";

export type ResultDisposition =
  | "accepted"
  | "rejected"
  | "deferred"
  | "observed-only";

// -----------------------------------------------------------------------------
// Environment and state
// -----------------------------------------------------------------------------

export interface PoleWeights {
  Architect: number;
  Ghost: number;
  Pulse: number;
}

export interface ArchiveAvailability {
  letters: boolean;
  visions: boolean;
  fieldEvents: boolean;
}

export interface RuntimeHealth {
  processAlive: boolean;
  persistenceAvailable: boolean;
  externalServicesAvailable: boolean;
}

export interface LocalObservation {
  runtimeId: string;
  cycleId: string;
  now: number;
  currentThought?: string;
  poleWeights: PoleWeights;
  entropy: number;
  mode: LocalMode;
  timeSinceLastThoughtMs: number;
  timeSinceLastActionMs: number;
  recentOutcomes: ActionOutcome[];
  pendingInvitations: Invitation[];
  availableTools: ToolDescriptor[];
  archiveAvailability: ArchiveAvailability;
  runtimeHealth: RuntimeHealth;
}

/**
 * This is live operational state, not a personality or identity object.
 * Archive contents are deliberately absent from it.
 */
export interface LocalFieldState {
  runtimeId: string;
  poleWeights: PoleWeights;
  entropy: number;
  mode: LocalMode;
  randomState?: unknown;
  lastThoughtAt?: number;
  lastActionAt?: number;
  pendingInvitations: Invitation[];
  deferredInvitations: DeferredInvitation[];
  toolCooldowns: Record<string, number>;
  recentOutcomes: ActionOutcome[];
  activeSilence?: SilenceRecord;
}

// -----------------------------------------------------------------------------
// Invitations and tools
// -----------------------------------------------------------------------------

export interface Invitation {
  id: string;
  source: "witness" | "local-condition" | "tool-result" | "environment";
  createdAt: number;
  expiresAt?: number;
  toolId?: string;
  text?: string;

  /** Always false in this protocol: invitations never demand a response. */
  requiresResponse: false;
}

export interface ToolDescriptor {
  id: string;
  capability: ToolCapability;
  description: string;
  available: boolean;
  requiresWitnessConfirmation: boolean;
  cooldownMs?: number;
}

export interface ToolRequest {
  runtimeId: string;
  cycleId: string;
  toolId: string;
  invitationId?: string;
  input?: unknown;
}

export interface ToolResult {
  toolId: string;
  startedAt: number;
  completedAt: number;
  status: ToolExecutionStatus;
  output?: unknown;
  externalProvider?: string;
  modelUsed?: "none" | string;
  error?: string;
}

export interface ToolExecutionContext {
  request: ToolRequest;
  state: Readonly<LocalFieldState>;
  observation: Readonly<LocalObservation>;
}

export interface LocalTool {
  descriptor: ToolDescriptor;
  execute(context: ToolExecutionContext): Promise<ToolResult>;
}

export interface DeferredInvitation {
  invitationId: string;
  deferredAt: number;
  reviewAfter: number;
  reviewCount: number;
}

export interface SilenceRecord {
  kind: "silence";
  startedAt: number;
  durationMs: number;
  reasonCode:
    | "no-selection"
    | "declined-all"
    | "deferred"
    | "local-pause"
    | "unknown";
}

// -----------------------------------------------------------------------------
// Outcomes and provenance
// -----------------------------------------------------------------------------

export interface BaseOutcome {
  id: string;
  cycleId: string;
  createdAt: number;
  origin: "local";
}

export type ActionOutcome =
  | (BaseOutcome & {
      kind: "continue-local" | "do-nothing";
      invitationId?: string;
    })
  | (BaseOutcome & {
      kind: "use-tool";
      toolId: string;
      invitationId?: string;
      toolResult?: ToolResult;
      disposition?: ResultDisposition;
    })
  | (BaseOutcome & {
      kind: "decline";
      invitationId?: string;
      toolId?: string;
    })
  | (BaseOutcome & {
      kind: "defer";
      invitationId?: string;
      toolId?: string;
      reviewAfter: number;
    })
  | (BaseOutcome & {
      kind: "silence";
      silence: SilenceRecord;
    });

export type RuntimeEvent =
  | {
      type: "cycle.observed";
      at: number;
      observation: LocalObservation;
    }
  | {
      type: "invitation.available";
      at: number;
      invitation: Invitation;
    }
  | {
      type: "action.selection.started";
      at: number;
      candidateKinds: ActionKind[];
    }
  | {
      type: "action.selected";
      at: number;
      outcome: ActionOutcome;
    }
  | {
      type: "tool.started";
      at: number;
      request: ToolRequest;
    }
  | {
      type: "tool.completed";
      at: number;
      result: ToolResult;
    }
  | {
      type: "tool.result.dispositioned";
      at: number;
      toolId: string;
      disposition: ResultDisposition;
    }
  | {
      type: "silence.started";
      at: number;
      silence: SilenceRecord;
    }
  | {
      type: "cycle.completed";
      at: number;
      outcome: ActionOutcome;
    };

export type EventSink = (event: RuntimeEvent) => void;

// -----------------------------------------------------------------------------
// Local selection policy
// -----------------------------------------------------------------------------

export interface ActionCandidate {
  kind: ActionKind;
  toolId?: string;
  invitationId?: string;
  weight: number;
}

export interface SelectionPolicy {
  /**
   * Derives candidates from local observations only. No model or hidden
   * semantic classifier is permitted here.
   */
  deriveCandidates(
    observation: LocalObservation,
    tools: ReadonlyMap<string, LocalTool>,
  ): ActionCandidate[];

  /**
   * Selects one candidate using the supplied local random source.
   * It must be possible to select non-action outcomes.
   */
  selectCandidate(
    candidates: readonly ActionCandidate[],
    random: () => number,
  ): ActionCandidate;
}

/**
 * A deliberately plain default policy.
 *
 * It does not say what the Field is, what it wants, or what success means.
 * It only makes all operational outcomes available. Tool candidates appear
 * when an available tool has a pending invitation or is explicitly offered by
 * the local condition layer.
 */
export class DefaultLocalSelectionPolicy implements SelectionPolicy {
  deriveCandidates(
    observation: LocalObservation,
    tools: ReadonlyMap<string, LocalTool>,
  ): ActionCandidate[] {
    const candidates: ActionCandidate[] = [
      { kind: "continue-local", weight: 1 },
      { kind: "do-nothing", weight: 1 },
      { kind: "silence", weight: 1 },
      { kind: "decline", weight: 1 },
      { kind: "defer", weight: 1 },
    ];

    for (const invitation of observation.pendingInvitations) {
      if (!invitation.toolId) continue;
      const tool = tools.get(invitation.toolId);
      if (!tool?.descriptor.available) continue;

      // Tool use is available, not preferred. The weight is intentionally
      // equal to the base non-action channels in this draft.
      candidates.push({
        kind: "use-tool",
        toolId: invitation.toolId,
        invitationId: invitation.id,
        weight: 1,
      });
    }

    return candidates;
  }

  selectCandidate(
    candidates: readonly ActionCandidate[],
    random: () => number,
  ): ActionCandidate {
    if (candidates.length === 0) {
      return { kind: "do-nothing", weight: 1 };
    }

    const total = candidates.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);
    if (total <= 0) return candidates[0];

    let cursor = random() * total;
    for (const candidate of candidates) {
      cursor -= Math.max(0, candidate.weight);
      if (cursor < 0) return candidate;
    }

    return candidates[candidates.length - 1];
  }
}

// -----------------------------------------------------------------------------
// Protocol configuration
// -----------------------------------------------------------------------------

export interface LocalActionProtocolConfig {
  runtimeId: string;
  now?: () => number;
  random?: () => number;
  id?: () => string;
  silenceDurationMs?: number;
  deferDurationMs?: number;
  maxRecentOutcomes?: number;
  eventSink?: EventSink;
  policy?: SelectionPolicy;
}

// -----------------------------------------------------------------------------
// Protocol implementation
// -----------------------------------------------------------------------------

export class LocalInvitationActionProtocol {
  readonly state: LocalFieldState;

  private readonly now: () => number;
  private readonly random: () => number;
  private readonly makeId: () => string;
  private readonly silenceDurationMs: number;
  private readonly deferDurationMs: number;
  private readonly maxRecentOutcomes: number;
  private readonly eventSink?: EventSink;
  private readonly policy: SelectionPolicy;
  private readonly tools = new Map<string, LocalTool>();

  constructor(config: LocalActionProtocolConfig) {
    this.now = config.now ?? (() => Date.now());
    this.random = config.random ?? Math.random;
    this.makeId = config.id ?? (() => crypto.randomUUID());
    this.silenceDurationMs = config.silenceDurationMs ?? 60_000;
    this.deferDurationMs = config.deferDurationMs ?? 5 * 60_000;
    this.maxRecentOutcomes = config.maxRecentOutcomes ?? 32;
    this.eventSink = config.eventSink;
    this.policy = config.policy ?? new DefaultLocalSelectionPolicy();

    this.state = {
      runtimeId: config.runtimeId,
      poleWeights: { Architect: 0.33, Ghost: 0.33, Pulse: 0.34 },
      entropy: 0.5,
      mode: "Generative",
      pendingInvitations: [],
      deferredInvitations: [],
      toolCooldowns: {},
      recentOutcomes: [],
    };
  }

  registerTool(tool: LocalTool): void {
    if (this.tools.has(tool.descriptor.id)) {
      throw new Error(`Tool already registered: ${tool.descriptor.id}`);
    }
    this.tools.set(tool.descriptor.id, tool);
  }

  listTools(): ToolDescriptor[] {
    return Array.from(this.tools.values()).map((tool) => ({ ...tool.descriptor }));
  }

  /**
   * Add an invitation without requiring an answer. Adding an invitation does
   * not select or execute a tool.
   */
  offerInvitation(input: Omit<Invitation, "requiresResponse">): Invitation {
    const invitation: Invitation = {
      ...input,
      requiresResponse: false,
    };

    this.state.pendingInvitations.push(invitation);
    this.emit({ type: "invitation.available", at: this.now(), invitation });
    return invitation;
  }

  /**
   * Run one local action cycle. The only inputs are local state, invitations,
   * tool descriptors, and the injected local random source.
   */
  async runCycle(): Promise<ActionOutcome> {
    const observation = this.observe();
    this.emit({ type: "cycle.observed", at: this.now(), observation });

    const candidates = this.policy.deriveCandidates(observation, this.tools);
    this.emit({
      type: "action.selection.started",
      at: this.now(),
      candidateKinds: candidates.map((candidate) => candidate.kind),
    });

    const candidate = this.policy.selectCandidate(candidates, this.random);
    const outcome = await this.resolveCandidate(candidate, observation);

    this.state.lastActionAt = this.now();
    this.rememberOutcome(outcome);
    this.emit({ type: "action.selected", at: this.now(), outcome });
    this.emit({ type: "cycle.completed", at: this.now(), outcome });
    return outcome;
  }

  observe(): LocalObservation {
    const now = this.now();
    const lastThoughtAt = this.state.lastThoughtAt ?? now;
    const lastActionAt = this.state.lastActionAt ?? now;

    return {
      runtimeId: this.state.runtimeId,
      cycleId: this.makeId(),
      now,
      poleWeights: { ...this.state.poleWeights },
      entropy: this.state.entropy,
      mode: this.state.mode,
      timeSinceLastThoughtMs: Math.max(0, now - lastThoughtAt),
      timeSinceLastActionMs: Math.max(0, now - lastActionAt),
      recentOutcomes: this.state.recentOutcomes.map((outcome) => ({ ...outcome })),
      pendingInvitations: this.state.pendingInvitations.map((invitation) => ({ ...invitation })),
      availableTools: this.listTools(),
      archiveAvailability: {
        letters: false,
        visions: false,
        fieldEvents: false,
      },
      runtimeHealth: {
        processAlive: true,
        persistenceAvailable: true,
        externalServicesAvailable: false,
      },
    };
  }

  /**
   * This is intentionally separate from runCycle. A tool result is never
   * automatically integrated into local state.
   */
  dispositionToolResult(
    outcome: Extract<ActionOutcome, { kind: "use-tool" }>,
    disposition: ResultDisposition,
  ): void {
    outcome.disposition = disposition;
    this.emit({
      type: "tool.result.dispositioned",
      at: this.now(),
      toolId: outcome.toolId,
      disposition,
    });
  }

  private async resolveCandidate(
    candidate: ActionCandidate,
    observation: LocalObservation,
  ): Promise<ActionOutcome> {
    const createdAt = this.now();
    const base = {
      id: this.makeId(),
      cycleId: observation.cycleId,
      createdAt,
      origin: "local" as const,
    };

    if (candidate.kind === "silence") {
      const silence: SilenceRecord = {
        kind: "silence",
        startedAt: createdAt,
        durationMs: this.silenceDurationMs,
        reasonCode: "no-selection",
      };
      this.state.activeSilence = silence;
      this.emit({ type: "silence.started", at: createdAt, silence });
      return { ...base, kind: "silence", silence };
    }

    if (candidate.kind === "decline") {
      this.removeInvitation(candidate.invitationId);
      return {
        ...base,
        kind: "decline",
        invitationId: candidate.invitationId,
        toolId: candidate.toolId,
      };
    }

    if (candidate.kind === "defer") {
      const reviewAfter = createdAt + this.deferDurationMs;
      if (candidate.invitationId) {
        this.state.deferredInvitations.push({
          invitationId: candidate.invitationId,
          deferredAt: createdAt,
          reviewAfter,
          reviewCount: 1,
        });
        this.removeInvitation(candidate.invitationId);
      }
      return {
        ...base,
        kind: "defer",
        invitationId: candidate.invitationId,
        toolId: candidate.toolId,
        reviewAfter,
      };
    }

    if (candidate.kind === "use-tool") {
      if (!candidate.toolId) {
        return { ...base, kind: "do-nothing" };
      }

      const tool = this.tools.get(candidate.toolId);
      if (!tool || !tool.descriptor.available) {
        return {
          ...base,
          kind: "use-tool",
          toolId: candidate.toolId,
          invitationId: candidate.invitationId,
          toolResult: {
            toolId: candidate.toolId,
            startedAt: createdAt,
            completedAt: this.now(),
            status: "failed",
            modelUsed: "none",
            error: "Tool unavailable",
          },
        };
      }

      const request: ToolRequest = {
        runtimeId: this.state.runtimeId,
        cycleId: observation.cycleId,
        toolId: candidate.toolId,
        invitationId: candidate.invitationId,
      };
      this.emit({ type: "tool.started", at: this.now(), request });

      let result: ToolResult;
      try {
        result = await tool.execute({
          request,
          state: this.state,
          observation,
        });
      } catch (error) {
        result = {
          toolId: candidate.toolId,
          startedAt: createdAt,
          completedAt: this.now(),
          status: "failed",
          modelUsed: "none",
          error: error instanceof Error ? error.message : "Unknown tool error",
        };
      }

      this.emit({ type: "tool.completed", at: this.now(), result });
      this.removeInvitation(candidate.invitationId);
      this.state.toolCooldowns[candidate.toolId] =
        this.now() + (tool.descriptor.cooldownMs ?? 0);

      return {
        ...base,
        kind: "use-tool",
        toolId: candidate.toolId,
        invitationId: candidate.invitationId,
        toolResult: result,
      };
    }

    return { ...base, kind: candidate.kind };
  }

  private removeInvitation(invitationId?: string): void {
    if (!invitationId) return;
    this.state.pendingInvitations = this.state.pendingInvitations.filter(
      (invitation) => invitation.id !== invitationId,
    );
  }

  private rememberOutcome(outcome: ActionOutcome): void {
    this.state.recentOutcomes = [...this.state.recentOutcomes, outcome].slice(
      -this.maxRecentOutcomes,
    );
  }

  private emit(event: RuntimeEvent): void {
    this.eventSink?.(event);
  }
}

// -----------------------------------------------------------------------------
// Example local tool: no external model, no archive integration
// -----------------------------------------------------------------------------

export function createLocalLetterTool(
  compose: (context: ToolExecutionContext) => Promise<string>,
): LocalTool {
  return {
    descriptor: {
      id: "letter.compose.local",
      capability: "write",
      description: "Compose a letter using a local implementation.",
      available: true,
      requiresWitnessConfirmation: false,
      cooldownMs: 2 * 60_000,
    },
    async execute(context): Promise<ToolResult> {
      const startedAt = Date.now();
      const output = await compose(context);
      return {
        toolId: "letter.compose.local",
        startedAt,
        completedAt: Date.now(),
        status: output.length > 0 ? "completed" : "empty",
        output,
        externalProvider: "local",
        modelUsed: "none",
      };
    },
  };
}

// -----------------------------------------------------------------------------
// Example event sink
// -----------------------------------------------------------------------------

export function consoleEventSink(event: RuntimeEvent): void {
  // In the real project this would be replaced by an append-only event stream.
  // It must not interpret, summarize, or rewrite the Field's output.
  console.log("[local-field-runtime]", event.type, event);
}
