export type FieldPole = "Architect" | "Ghost" | "Pulse";

const POLES: FieldPole[] = ["Architect", "Ghost", "Pulse"];

/**
 * Level A intentionally preserves the existing pulse mechanism:
 * literal input length modulo three selects the pole receiving the shift.
 * It does not inspect words, meanings, letters, or corpus content.
 */
export function deriveLevelANotice(input: string) {
  const lengthModulo = input.length % POLES.length;
  return {
    lengthModulo,
    targetPole: POLES[lengthModulo],
    shiftAmount: 0.1,
  };
}
