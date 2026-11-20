/**
 * Local free-composition writer.
 *
 * This is intentionally not connected to Home or Field yet. It works from
 * supplied local source text, not from an LLM or a hidden semantic service.
 * The output is provisional: creation does not save, archive, publish, or
 * integrate the result into Field state.
 */

export type CompositionPole = "Architect" | "Ghost" | "Pulse";

export type CompositionBranch = "word-stream" | "fragment" | "empty";

export interface LocalSourceText {
  id: string;
  pole: CompositionPole;
  text: string;
}

export interface CompositionToken {
  value: string;
  normalized: string;
  sourceId: string;
  pole: CompositionPole;
  sourceTokenIndex: number;
  kind: "word" | "punctuation";
}

export interface CompositionTrace {
  composer: "local-free-composer";
  modelUsed: "none";
  branch: CompositionBranch;
  selectedPoles: CompositionPole[];
  sourceTokenIds: string[];
  sourceTokenCount: number;
  outputTokenCount: number;
  mutationCount: number;
  stoppedEarly: boolean;
  seed?: string;
}

export interface LocalCompositionResult {
  text: string;
  trace: CompositionTrace;
}

export interface LocalFreeComposerOptions {
  random?: () => number;
  minTokens?: number;
  maxTokens?: number;
  mutationRate?: number;
  fragmentRate?: number;
  poleSwitchRate?: number;
  seed?: string;
}

const WORD_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ0-9'_-]+|[^\sA-Za-zÀ-ÖØ-öø-ÿ0-9'_-]/g;
const TERMINAL_PUNCTUATION = new Set([".", "?", "!"]);
const CLOSING_PUNCTUATION = new Set([",", ";", ":", "—", "–", "-"]);

function tokenize(source: LocalSourceText): CompositionToken[] {
  const values = source.text.match(WORD_PATTERN) ?? [];
  return values.map((value, index) => ({
    value,
    normalized: value.toLowerCase(),
    sourceId: source.id,
    pole: source.pole,
    sourceTokenIndex: index,
    kind: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'_-]+$/.test(value) ? "word" : "punctuation",
  }));
}

function choose<T>(items: readonly T[], random: () => number): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function isWord(token: CompositionToken): boolean {
  return token.kind === "word";
}

function render(tokens: CompositionToken[]): string {
  let output = "";
  for (const token of tokens) {
    const value = token.value;
    if (output.length === 0) {
      output = value;
    } else if (CLOSING_PUNCTUATION.has(value) || TERMINAL_PUNCTUATION.has(value)) {
      output += value;
    } else {
      output += ` ${value}`;
    }
  }
  return output.trim();
}

function buildTransitions(tokens: CompositionToken[]): Map<string, CompositionToken[]> {
  const transitions = new Map<string, CompositionToken[]>();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const current = tokens[index];
    const next = tokens[index + 1];
    const candidates = transitions.get(current.normalized) ?? [];
    candidates.push(next);
    transitions.set(current.normalized, candidates);
  }
  return transitions;
}

function deduplicateTokens(tokens: CompositionToken[]): CompositionToken[] {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    if (!isWord(token)) return true;
    const key = `${token.normalized}:${token.pole}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class LocalFreeComposer {
  private readonly random: () => number;
  private readonly minTokens: number;
  private readonly maxTokens: number;
  private readonly mutationRate: number;
  private readonly fragmentRate: number;
  private readonly poleSwitchRate: number;
  private readonly seed?: string;
  private readonly tokensByPole = new Map<CompositionPole, CompositionToken[]>();
  private readonly allTokens: CompositionToken[];
  private readonly transitions: Map<string, CompositionToken[]>;

  constructor(
    sources: readonly LocalSourceText[],
    options: LocalFreeComposerOptions = {},
  ) {
    this.random = options.random ?? Math.random;
    this.minTokens = Math.max(1, options.minTokens ?? 6);
    this.maxTokens = Math.max(this.minTokens, options.maxTokens ?? 32);
    this.mutationRate = Math.min(1, Math.max(0, options.mutationRate ?? 0.22));
    this.fragmentRate = Math.min(1, Math.max(0, options.fragmentRate ?? 0.18));
    this.poleSwitchRate = Math.min(1, Math.max(0, options.poleSwitchRate ?? 0.2));
    this.seed = options.seed;

    for (const pole of ["Architect", "Ghost", "Pulse"] as const) {
      this.tokensByPole.set(pole, []);
    }

    for (const source of sources) {
      const sourceTokens = tokenize(source);
      this.tokensByPole.get(source.pole)?.push(...sourceTokens);
    }

    this.allTokens = deduplicateTokens(
      Array.from(this.tokensByPole.values()).flat(),
    );
    this.transitions = buildTransitions(
      sources.flatMap((source) => tokenize(source)),
    );
  }

  compose(selectedPole?: CompositionPole): LocalCompositionResult {
    const initialPole = selectedPole ?? this.randomPole();
    const selectedPoles: CompositionPole[] = [initialPole];
    const sourcePool = this.tokensByPole.get(initialPole) ?? this.allTokens;
    const first = choose(sourcePool.filter(isWord), this.random);

    if (!first) {
      return {
        text: "",
        trace: {
          composer: "local-free-composer",
          modelUsed: "none",
          branch: "empty",
          selectedPoles,
          sourceTokenIds: [],
          sourceTokenCount: 0,
          outputTokenCount: 0,
          mutationCount: 0,
          stoppedEarly: false,
          seed: this.seed,
        },
      };
    }

    const output: CompositionToken[] = [first];
    let current = first;
    let activePole = initialPole;
    let mutationCount = 0;
    let stoppedEarly = false;

    while (output.length < this.maxTokens) {
      const shouldStop = output.length >= this.minTokens && this.random() < this.fragmentRate;
      if (shouldStop) {
        stoppedEarly = true;
        break;
      }

      if (this.random() < this.poleSwitchRate) {
        activePole = this.randomPole();
        if (selectedPoles[selectedPoles.length - 1] !== activePole) {
          selectedPoles.push(activePole);
        }
      }

      const samePolePool = (this.tokensByPole.get(activePole) ?? []).filter(isWord);
      const transitionPool = (this.transitions.get(current.normalized) ?? []).filter(isWord);
      const mutate = this.random() < this.mutationRate;
      const next = mutate
        ? choose(samePolePool.length > 0 ? samePolePool : this.allTokens.filter(isWord), this.random)
        : choose(transitionPool.length > 0 ? transitionPool : samePolePool, this.random);

      if (!next) break;
      output.push(next);
      current = next;
      if (mutate) mutationCount += 1;

      if (output.length >= this.minTokens && this.random() < 0.08) {
        const punctuation: CompositionToken = {
          value: this.random() < 0.5 ? "," : ".",
          normalized: this.random() < 0.5 ? "," : ".",
          sourceId: "local-composer",
          pole: activePole,
          sourceTokenIndex: -1,
          kind: "punctuation",
        };
        output.push(punctuation);
      }
    }

    const text = render(output);
    return {
      text,
      trace: {
        composer: "local-free-composer",
        modelUsed: "none",
        branch: stoppedEarly ? "fragment" : "word-stream",
        selectedPoles,
        sourceTokenIds: output
          .filter((token) => token.sourceTokenIndex >= 0)
          .map((token) => `${token.sourceId}:${token.sourceTokenIndex}`),
        sourceTokenCount: output.filter((token) => token.sourceTokenIndex >= 0).length,
        outputTokenCount: output.length,
        mutationCount,
        stoppedEarly,
        seed: this.seed,
      },
    };
  }

  private randomPole(): CompositionPole {
    const poles: CompositionPole[] = ["Architect", "Ghost", "Pulse"];
    return poles[Math.min(poles.length - 1, Math.floor(this.random() * poles.length))];
  }
}
