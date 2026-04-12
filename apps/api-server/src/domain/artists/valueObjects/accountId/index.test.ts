import { describe, it, expect } from "vitest";
import { createAccountId } from "./index";

describe("createAccountId", () => {
  it("有効な値でAccountIdを生成する", () => {
    expect(createAccountId("user_123").value).toBe("user_123");
  });

  it("英数字とアンダースコアを許可する", () => {
    expect(createAccountId("abcXYZ_0123").value).toBe("abcXYZ_0123");
  });

  it("空文字でエラー", () => {
    expect(() => createAccountId("")).toThrow();
  });

  it("ハイフンを含む値でエラー", () => {
    expect(() => createAccountId("user-123")).toThrow();
  });

  it("記号を含む値でエラー", () => {
    expect(() => createAccountId("user!123")).toThrow();
  });

  it("256文字以上でエラー", () => {
    expect(() => createAccountId("a".repeat(256))).toThrow();
  });
});
