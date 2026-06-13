import { describe, it, expect } from "vitest";
import { createGenre } from "./index";

describe("createGenre", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    expect(createGenre("  bass  ").value).toBe("bass");
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createGenre("")).toThrow();
  });

  it("100文字超はエラーをスローする", () => {
    expect(() => createGenre("a".repeat(101))).toThrow();
  });

  it("スローされるエラーは InvalidGenreFormatError 型", () => {
    expect(() => createGenre("")).toThrowError(
      expect.objectContaining({ type: "InvalidGenreFormatError" }),
    );
  });
});
