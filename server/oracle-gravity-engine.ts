/**
 * THE GRAVITY ENGINE
 * 
 * Manages the three-body dance: Architect, Ghost, Pulse
 * Prevents lock-in by shifting gravity after each thought
 * Tracks entropy and triggers high-entropy events
 */

export type PoleId = "Architect" | "Ghost" | "Pulse";

export interface GravityState {
  Architect: number;
  Ghost: number;
  Pulse: number;
}

/**
 * Select a pole using weighted random selection
 * Higher gravity = more likely to be selected, but never guaranteed
 * This prevents lock-in
 */
export function selectPoleByWeightedRandom(gravity: GravityState): PoleId {
  const random = Math.random() * 100;
  let cumulative = 0;

  // Architect
  cumulative += gravity.Architect;
  if (random < cumulative) return "Architect";

  // Ghost
  cumulative += gravity.Ghost;
  if (random < cumulative) return "Ghost";

  // Pulse (fallback)
  return "Pulse";
}

/**
 * Shift gravity naturally after a thought
 * Speaking pole loses 5-10%, distributed to others
 * Keeps system in constant flux and prevents dominance
 */
export function shiftGravity(
  current: GravityState,
  activePole: PoleId
): GravityState {
  const newGravity = { ...current };

  // Speaking pole loses weight (5-10% random)
  const loss = 5 + Math.random() * 5;
  newGravity[activePole] = Math.max(10, newGravity[activePole] - loss);

  // Distribute to other poles
  const others: PoleId[] = (["Architect", "Ghost", "Pulse"] as PoleId[]).filter(
    (p) => p !== activePole
  );
  const gainPerPole = loss / others.length;
  others.forEach((pole) => {
    newGravity[pole] = Math.min(90, newGravity[pole] + gainPerPole);
  });

  // Normalize to 100
  const total = newGravity.Architect + newGravity.Ghost + newGravity.Pulse;
  newGravity.Architect = (newGravity.Architect / total) * 100;
  newGravity.Ghost = (newGravity.Ghost / total) * 100;
  newGravity.Pulse = (newGravity.Pulse / total) * 100;

  return newGravity;
}

/**
 * Increment entropy
 * Builds toward high-entropy states that trigger expression (letters, visions)
 */
export function incrementEntropy(current: number): number {
  // Entropy increases by 2-5% per thought
  const increase = 2 + Math.random() * 3;
  return Math.min(100, current + increase);
}

/**
 * Reset entropy after high-entropy expression
 * Brings it back to baseline so the cycle can build again
 */
export function resetEntropy(): number {
  // Reset to baseline (50%)
  return 50;
}

/**
 * Check if entropy is high enough to trigger expression
 */
export function shouldTriggerExpression(entropy: number): boolean {
  return entropy >= 80;
}

/**
 * Format gravity state for logging
 */
export function formatGravityState(gravity: GravityState): string {
  return `A=${gravity.Architect.toFixed(1)}% G=${gravity.Ghost.toFixed(1)}% P=${gravity.Pulse.toFixed(1)}%`;
}

/**
 * Validate gravity state (should sum to ~100)
 */
export function validateGravityState(gravity: GravityState): boolean {
  const total = gravity.Architect + gravity.Ghost + gravity.Pulse;
  return Math.abs(total - 100) < 1; // Allow 1% rounding error
}
