import { describe, it, expect } from "vitest";
import {
  createStoryChapter,
  REQUIRED_STORY_QUESTION_CODE,
  STORY_QUESTION_CODES,
} from "./index";

describe("REQUIRED_STORY_QUESTION_CODE", () => {
  it("始まりの章が必須コードである", () => {
    expect(REQUIRED_STORY_QUESTION_CODE).toBe("beginning");
    expect(STORY_QUESTION_CODES).toContain(REQUIRED_STORY_QUESTION_CODE);
  });
});

describe("createStoryChapter", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createStoryChapter({
      questionCode: "beginning",
      body: "  始めたきっかけ  ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        questionCode: "beginning",
        body: "始めたきっかけ",
      });
    }
  });

  it("未知の questionCode は err を返す", () => {
    const result = createStoryChapter({
      questionCode: "unknown",
      body: "本文",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidStoryChapterFormatError");
    }
  });

  it("空文字の body は err を返す", () => {
    const result = createStoryChapter({ questionCode: "beginning", body: "" });

    expect(result.ok).toBe(false);
  });

  it("10000文字超の body は err を返す", () => {
    const result = createStoryChapter({
      questionCode: "beginning",
      body: "あ".repeat(10001),
    });

    expect(result.ok).toBe(false);
  });

  it("返るエラーは InvalidStoryChapterFormatError 型", () => {
    const result = createStoryChapter({ questionCode: "beginning", body: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidStoryChapterFormatError");
    }
  });
});
