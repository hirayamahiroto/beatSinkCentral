import { describe, it, expect } from "vitest";
import { createSnsUrl } from "./index";

describe("createSnsUrl", () => {
  it("有効な URL で生成する", () => {
    const result = createSnsUrl("https://x.com/taro");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("https://x.com/taro");
    }
  });

  it("URL でない文字列は err を返す", () => {
    expect(createSnsUrl("at-taro").ok).toBe(false);
  });

  it("空文字は err を返す", () => {
    expect(createSnsUrl("").ok).toBe(false);
  });

  it("返るエラーは InvalidSnsUrlFormatError 型", () => {
    const result = createSnsUrl("at-taro");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});
