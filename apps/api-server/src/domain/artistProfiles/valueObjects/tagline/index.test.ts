import { describe, it, expect } from "vitest";
import { createTagline } from "./index";

describe("createTagline", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createTagline("  音で旅する  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("音で旅する");
    }
  });

  it("空文字は err を返す", () => {
    expect(createTagline("").ok).toBe(false);
  });

  it("255文字超は err を返す", () => {
    expect(createTagline("a".repeat(256)).ok).toBe(false);
  });

  it("返るエラーは InvalidTaglineFormatError 型", () => {
    const result = createTagline("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidTaglineFormatError");
    }
  });
});
