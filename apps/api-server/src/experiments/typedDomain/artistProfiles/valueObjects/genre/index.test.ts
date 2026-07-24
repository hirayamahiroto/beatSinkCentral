import { describe, it, expect } from "vitest";
import { createGenre } from "./index";

describe("createGenre", () => {
  it("正当なら ok(Genre) を返す", () => {
    const result = createGenre("Loopstation");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("Genre");
    }
  });

  it("空なら err を返す", () => {
    expect(createGenre("").ok).toBe(false);
  });

  it("100文字超なら err を返す", () => {
    expect(createGenre("a".repeat(101)).ok).toBe(false);
  });
});
