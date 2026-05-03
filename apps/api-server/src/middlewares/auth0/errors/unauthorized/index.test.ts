import { describe, it, expect } from "vitest";
import { createUnauthorizedError, isUnauthorizedError } from "./index";

describe("UnauthorizedError", () => {
  it("type を保持した Error を生成する", () => {
    const error = createUnauthorizedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UnauthorizedError");
  });

  it("message に type 名が入る", () => {
    const error = createUnauthorizedError();

    expect(error.message).toBe("UnauthorizedError");
  });
});

describe("isUnauthorizedError", () => {
  it("UnauthorizedError を判別できる", () => {
    expect(isUnauthorizedError(createUnauthorizedError())).toBe(true);
  });

  it("素の Error は false を返す", () => {
    expect(isUnauthorizedError(new Error("boom"))).toBe(false);
  });

  it("type が異なる Error は false を返す", () => {
    const other = Object.assign(new Error("other"), {
      type: "OtherError" as const,
    });

    expect(isUnauthorizedError(other)).toBe(false);
  });

  it("Error 以外の値は false を返す", () => {
    expect(isUnauthorizedError("string")).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });
});
