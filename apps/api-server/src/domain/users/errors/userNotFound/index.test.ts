import { describe, it, expect } from "vitest";
import { createUserNotFoundError, isUserNotFoundError } from "./index";

describe("UserNotFoundError", () => {
  it("type に UserNotFoundError を持つ Error を生成する", () => {
    const error = createUserNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UserNotFoundError");
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(isUserNotFoundError(createUserNotFoundError())).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isUserNotFoundError(new Error("boom"))).toBe(false);
    expect(isUserNotFoundError({ type: "UserNotFoundError" })).toBe(false);
    expect(isUserNotFoundError(null)).toBe(false);
  });
});
