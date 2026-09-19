import { describe, it, expect } from "vitest";
import { createOfferComment } from "./index";

describe("createOfferComment", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createOfferComment("  この日は新曲をやります  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("この日は新曲をやります");
    }
  });

  it("空文字は err を返す", () => {
    expect(createOfferComment("").ok).toBe(false);
  });

  it("500文字超は err を返す", () => {
    expect(createOfferComment("a".repeat(501)).ok).toBe(false);
  });

  it("返るエラーは InvalidOfferCommentFormatError 型", () => {
    const result = createOfferComment("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidOfferCommentFormatError");
    }
  });
});
