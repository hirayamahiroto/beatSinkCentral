import { describe, it, expect } from "vitest";
import { createAccountId } from "./index";

describe("createAccountId", () => {
  it("有効な値でAccountIdを生成する", () => {
    const result = createAccountId("user_123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("user_123");
    }
  });

  it("英数字とアンダースコアを許可する", () => {
    const result = createAccountId("abcXYZ_0123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("abcXYZ_0123");
    }
  });

  it("空文字で err", () => {
    expect(createAccountId("").ok).toBe(false);
  });

  it("ハイフンを含む値で err", () => {
    expect(createAccountId("user-123").ok).toBe(false);
  });

  it("記号を含む値で err", () => {
    expect(createAccountId("user!123").ok).toBe(false);
  });

  it("256文字以上で err", () => {
    expect(createAccountId("a".repeat(256)).ok).toBe(false);
  });
});
