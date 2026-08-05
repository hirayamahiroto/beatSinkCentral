import { describe, it, expect } from "vitest";
import { createImageUrl } from "./index";

describe("createImageUrl", () => {
  it("有効な URL で生成する", () => {
    const result = createImageUrl("https://example.com/a.png");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("https://example.com/a.png");
    }
  });

  it("URL でない文字列は err を返す", () => {
    expect(createImageUrl("not-a-url").ok).toBe(false);
  });

  it("空文字は err を返す", () => {
    expect(createImageUrl("").ok).toBe(false);
  });

  it("返るエラーは InvalidImageUrlFormatError 型", () => {
    const result = createImageUrl("not-a-url");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidImageUrlFormatError");
    }
  });
});
