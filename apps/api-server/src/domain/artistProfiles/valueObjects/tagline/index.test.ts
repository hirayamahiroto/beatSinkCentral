import { describe, it, expect } from "vitest";
import { createTagline } from "./index";

describe("createTagline", () => {
  it("有効な値で生成し、前後の空白を正規化する", () => {
    expect(createTagline("  音で旅する  ").value).toBe("音で旅する");
  });

  it("空文字はエラーをスローする", () => {
    expect(() => createTagline("")).toThrow();
  });

  it("255文字超はエラーをスローする", () => {
    expect(() => createTagline("a".repeat(256))).toThrow();
  });

  it("スローされるエラーは InvalidTaglineFormatError 型", () => {
    expect(() => createTagline("")).toThrowError(
      expect.objectContaining({ type: "InvalidTaglineFormatError" }),
    );
  });
});
