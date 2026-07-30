import { describe, it, expect } from "vitest";
import { createProfileName } from "./index";

describe("createProfileName", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    const result = createProfileName("  Taro  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("Taro");
    }
  });

  it("空文字は err を返す", () => {
    expect(createProfileName("").ok).toBe(false);
  });

  it("255文字超は err を返す", () => {
    expect(createProfileName("a".repeat(256)).ok).toBe(false);
  });

  it("返るエラーは InvalidProfileNameFormatError 型", () => {
    const result = createProfileName("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileNameFormatError");
    }
  });
});
