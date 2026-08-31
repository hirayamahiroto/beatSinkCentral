import { describe, it, expect } from "vitest";
import { createHandle } from "./index";

describe("createHandle", () => {
  it("有効な値でHandleを生成する", () => {
    const result = createHandle("user_123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("user_123");
    }
  });

  it("英数字とアンダースコアを許可する", () => {
    const result = createHandle("abcXYZ_0123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("abcXYZ_0123");
    }
  });

  it("空文字は err を返す", () => {
    expect(createHandle("").ok).toBe(false);
  });

  it("ハイフンを含む値は err を返す", () => {
    expect(createHandle("user-123").ok).toBe(false);
  });

  it("記号を含む値は err を返す", () => {
    expect(createHandle("user!123").ok).toBe(false);
  });

  it("256文字以上は err を返す", () => {
    expect(createHandle("a".repeat(256)).ok).toBe(false);
  });

  it("返るエラーは InvalidHandleFormatError 型", () => {
    const result = createHandle("user-123");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidHandleFormatError");
    }
  });
});
