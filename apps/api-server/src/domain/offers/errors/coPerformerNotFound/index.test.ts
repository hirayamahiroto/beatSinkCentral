import { describe, it, expect } from "vitest";
import { createCoPerformerNotFoundError } from "./index";

describe("CoPerformerNotFoundError", () => {
  it("type に CoPerformerNotFoundError と見つからなかった handle を持つ Error を生成する", () => {
    const error = createCoPerformerNotFoundError("hana_bb");

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("CoPerformerNotFoundError");
    expect(error.handle).toBe("hana_bb");
  });
});
