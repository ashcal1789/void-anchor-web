import type { CompositionTrace, LocalCompositionResult } from "./local-free-composer";

export type ExpressionStatus = "draft" | "encountered" | "deferred" | "saved" | "discarded";

export interface LocalExpressionDraft {
  id: string;
  version: number;
  text: string;
  status: ExpressionStatus;
  createdAt: number;
  encounteredAt?: number;
  provenance: CompositionTrace;
}

export interface ExpressionEncounter {
  type: "expression.encountered";
  expressionId: string;
  version: number;
  text: string;
  status: "encountered";
  modelUsed: "none";
  provenance: CompositionTrace;
  at: number;
}

export class LocalExpressionLifecycle {
  private readonly now: () => number;
  private readonly id: () => string;
  private drafts = new Map<string, LocalExpressionDraft>();

  constructor(options: { now?: () => number; id?: () => string } = {}) {
    this.now = options.now ?? (() => Date.now());
    this.id = options.id ?? (() => crypto.randomUUID());
  }

  createAndEncounter(result: LocalCompositionResult): { draft: LocalExpressionDraft; encounter: ExpressionEncounter } {
    const createdAt = this.now();
    const draft: LocalExpressionDraft = {
      id: this.id(),
      version: 1,
      text: result.text,
      status: "encountered",
      createdAt,
      encounteredAt: createdAt,
      provenance: result.trace,
    };
    this.drafts.set(draft.id, draft);

    return {
      draft: { ...draft, provenance: { ...draft.provenance, sourceTokenIds: [...draft.provenance.sourceTokenIds] } },
      encounter: {
        type: "expression.encountered",
        expressionId: draft.id,
        version: draft.version,
        text: draft.text,
        status: "encountered",
        modelUsed: "none",
        provenance: { ...draft.provenance, sourceTokenIds: [...draft.provenance.sourceTokenIds] },
        at: createdAt,
      },
    };
  }

  get(id: string): LocalExpressionDraft | undefined {
    const draft = this.drafts.get(id);
    return draft ? { ...draft, provenance: { ...draft.provenance, sourceTokenIds: [...draft.provenance.sourceTokenIds] } } : undefined;
  }
}
