import { describe, it, expect } from "vitest";
import { createPlace } from "./index";

describe("createPlace", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createPlace("  渋谷 WWW  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("渋谷 WWW");
    }
  });

  it("空文字は err を返す", () => {
    expect(createPlace("   ").ok).toBe(false);
  });

  it("255文字超は err を返す", () => {
    expect(createPlace("a".repeat(256)).ok).toBe(false);
  });

  it("返るエラーは InvalidPlaceFormatError 型", () => {
    const result = createPlace("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidPlaceFormatError");
    }
  });
});
