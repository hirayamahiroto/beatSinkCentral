import { describe, it, expect } from "vitest";
import { createName } from "./index";

describe("createName", () => {
  it("有効な名前で生成する", () => {
    const result = createName("testuser");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("testuser");
    }
  });

  it("空文字は err を返す", () => {
    expect(createName("").ok).toBe(false);
  });

  it("255文字超は err を返す", () => {
    expect(createName("a".repeat(256)).ok).toBe(false);
  });

  it("返るエラーは InvalidNameFormatError 型", () => {
    const result = createName("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidNameFormatError");
    }
  });
});
