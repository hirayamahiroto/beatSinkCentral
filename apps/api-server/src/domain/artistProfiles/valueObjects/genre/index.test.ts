import { describe, it, expect } from "vitest";
import { createGenre } from "./index";

describe("createGenre", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createGenre("  bass  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("bass");
    }
  });

  it("空文字は err を返す", () => {
    expect(createGenre("").ok).toBe(false);
  });

  it("100文字超は err を返す", () => {
    expect(createGenre("a".repeat(101)).ok).toBe(false);
  });

  it("返るエラーは InvalidGenreFormatError 型", () => {
    const result = createGenre("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidGenreFormatError");
    }
  });
});
