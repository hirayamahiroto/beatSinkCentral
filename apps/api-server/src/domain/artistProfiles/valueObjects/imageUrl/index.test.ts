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

  it("http の URL は ok（ローカル Supabase の public URL を許容）", () => {
    expect(createImageUrl("http://127.0.0.1:54321/storage/v1/a.png").ok).toBe(
      true,
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "ftp://example.com/a.png",
  ])("http/https 以外の scheme (%s) は err を返す", (value) => {
    expect(createImageUrl(value).ok).toBe(false);
  });
});
