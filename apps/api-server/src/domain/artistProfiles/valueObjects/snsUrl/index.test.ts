import { describe, it, expect } from "vitest";
import { createSnsUrl } from "./index";

describe("createSnsUrl", () => {
  it("有効な URL で生成する", () => {
    expect(createSnsUrl("https://x.com/taro").value).toBe("https://x.com/taro");
  });

  it("URL でない文字列はエラーをスローする", () => {
    expect(() => createSnsUrl("at-taro")).toThrow();
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createSnsUrl("")).toThrow();
  });

  it("スローされるエラーは InvalidSnsUrlFormatError 型", () => {
    expect(() => createSnsUrl("at-taro")).toThrowError(
      expect.objectContaining({ type: "InvalidSnsUrlFormatError" }),
    );
  });
});
