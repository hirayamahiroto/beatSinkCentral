import { describe, it, expect } from "vitest";
import { createActivityInfo } from "./index";

describe("createActivityInfo", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createActivityInfo("  東京 / ソロ  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("東京 / ソロ");
    }
  });

  it("空文字は err を返す", () => {
    expect(createActivityInfo("").ok).toBe(false);
  });

  it("1000文字超は err を返す", () => {
    expect(createActivityInfo("a".repeat(1001)).ok).toBe(false);
  });

  it("返るエラーは InvalidActivityInfoFormatError 型", () => {
    const result = createActivityInfo("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidActivityInfoFormatError");
    }
  });
});
