import { describe, it, expect } from "vitest";
import {
  createUserAlreadyRegisteredError,
  isUserAlreadyRegisteredError,
} from "./index";

describe("UserAlreadyRegisteredError", () => {
  it("type に UserAlreadyRegisteredError を持つ Error を生成する", () => {
    const error = createUserAlreadyRegisteredError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UserAlreadyRegisteredError");
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(
      isUserAlreadyRegisteredError(createUserAlreadyRegisteredError()),
    ).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isUserAlreadyRegisteredError(new Error("boom"))).toBe(false);
    expect(
      isUserAlreadyRegisteredError({ type: "UserAlreadyRegisteredError" }),
    ).toBe(false);
    expect(isUserAlreadyRegisteredError(null)).toBe(false);
  });
});
