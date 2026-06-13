import { describe, it, expect } from "vitest";
import { createStory } from "./index";

describe("createStory", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    expect(createStory("  私の歩み  ").value).toBe("私の歩み");
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createStory("")).toThrow();
  });

  it("10000文字超はエラーをスローする", () => {
    expect(() => createStory("あ".repeat(10001))).toThrow();
  });

  it("スローされるエラーは InvalidStoryFormatError 型", () => {
    expect(() => createStory("")).toThrowError(
      expect.objectContaining({ type: "InvalidStoryFormatError" }),
    );
  });
});
