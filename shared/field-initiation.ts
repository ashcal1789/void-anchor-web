import { detectSignalWords } from "./letter-signals";

export type FieldInitiationCondition = "letter-signal" | "high-entropy-with-three-or-more-thoughts";

/**
 * Passive Field observation only. This deliberately mirrors two existing Home
 * eligibility conditions without its probability check or letter-writing call.
 */
export function observeFieldInitiationCondition(input: {
  thoughtText: string;
  entropy: number;
  fieldThoughtCount: number;
}): { observed: boolean; conditions: FieldInitiationCondition[] } {
  const signals = detectSignalWords(input.thoughtText);
  const conditions: FieldInitiationCondition[] = [];

  if (signals.letter) conditions.push("letter-signal");
  if (input.entropy > 80 && input.fieldThoughtCount >= 3) {
    conditions.push("high-entropy-with-three-or-more-thoughts");
  }

  return { observed: conditions.length > 0, conditions };
}
