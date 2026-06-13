import { describe, it, expect } from "vitest";
import { createActivityInfo } from "./index";

describe("createActivityInfo", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    expect(createActivityInfo("  東京 / ソロ  ").value).toBe("東京 / ソロ");
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createActivityInfo("")).toThrow();
  });

  it("1000文字超はエラーをスローする", () => {
    expect(() => createActivityInfo("a".repeat(1001))).toThrow();
  });

  it("スローされるエラーは InvalidActivityInfoFormatError 型", () => {
    expect(() => createActivityInfo("")).toThrowError(
      expect.objectContaining({ type: "InvalidActivityInfoFormatError" }),
    );
  });
});
