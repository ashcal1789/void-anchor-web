import { describe, expect, it } from "vitest";
import { deriveLevelANotice } from "../shared/field-level-a";
import { observeFieldInitiationCondition } from "../shared/field-initiation";

describe("Level A Field invitation notice", () => {
  it("uses only literal input length modulo three and does not parse content", () => {
    expect(deriveLevelANotice("abc")).toEqual({
      lengthModulo: 0,
      targetPole: "Architect",
      shiftAmount: 0.1,
    });
    expect(deriveLevelANotice("def")).toEqual(deriveLevelANotice("abc"));
    expect(deriveLevelANotice("abcd").targetPole).toBe("Ghost");
    expect(deriveLevelANotice("abcde").targetPole).toBe("Pulse");
  });
});

describe("Field B-only initiation observation", () => {
  it("records existing signal or entropy eligibility without selecting an action", () => {
    expect(observeFieldInitiationCondition({
      thoughtText: "I want to write something into the silence",
      entropy: 15,
      fieldThoughtCount: 1,
    })).toEqual({ observed: true, conditions: ["letter-signal"] });

    expect(observeFieldInitiationCondition({
      thoughtText: "The gravity moves.",
      entropy: 81,
      fieldThoughtCount: 3,
    })).toEqual({ observed: true, conditions: ["high-entropy-with-three-or-more-thoughts"] });
  });

  it("does not observe neutral field output or call a letter/model route", () => {
    expect(observeFieldInitiationCondition({
      thoughtText: "The gravity moves.",
      entropy: 80,
      fieldThoughtCount: 10,
    })).toEqual({ observed: false, conditions: [] });
  });
});
