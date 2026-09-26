import { describe, it, expect } from "vitest";
import { createHandleAlreadyTakenError } from "./index";

describe("HandleAlreadyTakenError", () => {
  it("type に HandleAlreadyTakenError を持つ Error を生成する", () => {
    const error = createHandleAlreadyTakenError("taken_id");

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("HandleAlreadyTakenError");
  });

  it("衝突した handle を保持する", () => {
    expect(createHandleAlreadyTakenError("taken_id").handle).toBe("taken_id");
  });
});
