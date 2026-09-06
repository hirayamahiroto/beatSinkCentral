import { describe, it, expect } from "vitest";
import { createTicketUrl } from "./index";

describe("createTicketUrl", () => {
  it("有効な URL で生成し、前後の空白を正規化する", () => {
    const result = createTicketUrl("  https://tickets.example.com/e/1  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("https://tickets.example.com/e/1");
    }
  });

  it("空文字は err を返す", () => {
    expect(createTicketUrl("").ok).toBe(false);
  });

  it("URL 形式でない値は err を返す", () => {
    expect(createTicketUrl("tickets.example.com").ok).toBe(false);
  });

  it("2048文字超は err を返す", () => {
    expect(createTicketUrl(`https://e.com/${"a".repeat(2048)}`).ok).toBe(false);
  });

  it("返るエラーは InvalidTicketUrlFormatError 型", () => {
    const result = createTicketUrl("not-a-url");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidTicketUrlFormatError");
    }
  });
});
