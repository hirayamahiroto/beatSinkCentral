import { describe, it, expect } from "vitest";
import { createImageUrl } from "./index";

describe("createImageUrl", () => {
  it("有効な URL で生成する", () => {
    expect(createImageUrl("https://example.com/a.png").value).toBe(
      "https://example.com/a.png",
    );
  });

  it("URL でない文字列はエラーをスローする", () => {
    expect(() => createImageUrl("not-a-url")).toThrow();
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createImageUrl("")).toThrow();
  });

  it("スローされるエラーは InvalidImageUrlFormatError 型", () => {
    expect(() => createImageUrl("not-a-url")).toThrowError(
      expect.objectContaining({ type: "InvalidImageUrlFormatError" }),
    );
  });
});
