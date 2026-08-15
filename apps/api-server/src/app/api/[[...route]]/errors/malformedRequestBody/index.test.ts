import { describe, it, expect } from "vitest";
import {
  createMalformedRequestBodyError,
  isMalformedRequestBodyError,
} from "./index";

describe("MalformedRequestBodyError", () => {
  it("type を保持した Error を生成する", () => {
    const error = createMalformedRequestBodyError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("MalformedRequestBodyError");
  });

  it("message に type 名が入る", () => {
    const error = createMalformedRequestBodyError();

    expect(error.message).toBe("MalformedRequestBodyError");
  });
});

describe("isMalformedRequestBodyError", () => {
  it("MalformedRequestBodyError を判別できる", () => {
    expect(isMalformedRequestBodyError(createMalformedRequestBodyError())).toBe(
      true,
    );
  });

  it("素の Error は false を返す", () => {
    expect(isMalformedRequestBodyError(new Error("boom"))).toBe(false);
  });

  it("type が異なる Error は false を返す", () => {
    const other = Object.assign(new Error("other"), {
      type: "OtherError" as const,
    });

    expect(isMalformedRequestBodyError(other)).toBe(false);
  });

  it("Error 以外の値は false を返す", () => {
    expect(isMalformedRequestBodyError("string")).toBe(false);
    expect(isMalformedRequestBodyError(null)).toBe(false);
    expect(isMalformedRequestBodyError(undefined)).toBe(false);
  });
});
