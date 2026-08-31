import { describe, it, expect } from "vitest";
import {
  createHandleAlreadyTakenError,
  isHandleAlreadyTakenError,
} from "./index";

describe("HandleAlreadyTakenError", () => {
  it("type に HandleAlreadyTakenError を持つ Error を生成する", () => {
    const error = createHandleAlreadyTakenError("taken_id");

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("HandleAlreadyTakenError");
  });

  it("衝突した handle を保持する", () => {
    expect(createHandleAlreadyTakenError("taken_id").handle).toBe("taken_id");
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(
      isHandleAlreadyTakenError(createHandleAlreadyTakenError("taken_id")),
    ).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isHandleAlreadyTakenError(new Error("boom"))).toBe(false);
    expect(
      isHandleAlreadyTakenError({
        type: "HandleAlreadyTakenError",
        handle: "taken_id",
      }),
    ).toBe(false);
    expect(isHandleAlreadyTakenError(null)).toBe(false);
  });
});
