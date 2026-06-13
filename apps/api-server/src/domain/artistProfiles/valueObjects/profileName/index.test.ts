import { describe, it, expect } from "vitest";
import { createProfileName } from "./index";

describe("createProfileName", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    expect(createProfileName("  Taro  ").value).toBe("Taro");
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createProfileName("")).toThrow();
  });

  it("255文字超はエラーをスローする", () => {
    expect(() => createProfileName("a".repeat(256))).toThrow();
  });

  it("スローされるエラーは InvalidProfileNameFormatError 型", () => {
    expect(() => createProfileName("")).toThrowError(
      expect.objectContaining({ type: "InvalidProfileNameFormatError" }),
    );
  });
});
