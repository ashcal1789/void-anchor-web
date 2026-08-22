import { describe, expect, it } from "vitest";
import { deriveLevelANotice } from "../shared/field-level-a";

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
