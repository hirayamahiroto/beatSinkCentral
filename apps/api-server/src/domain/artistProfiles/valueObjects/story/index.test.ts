import { describe, it, expect } from "vitest";
import { createStory } from "./index";

describe("createStory", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createStory("  私の歩み  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("私の歩み");
    }
  });

  it("空文字は err を返す", () => {
    expect(createStory("").ok).toBe(false);
  });

  it("10000文字超は err を返す", () => {
    expect(createStory("あ".repeat(10001)).ok).toBe(false);
  });

  it("返るエラーは InvalidStoryFormatError 型", () => {
    const result = createStory("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidStoryFormatError");
    }
  });
});
