import { describe, it, expect } from "vitest";
import { createName } from "./index";

describe("createName", () => {
  it("有効な名前を返す", () => {
    expect(createName("testuser").value).toBe("testuser");
  });

  it("無効な名前を返す", () => {
    expect(() => createName("")).toThrow("Invalid name format");
    expect(() => createName("a".repeat(256))).toThrow("Invalid name format");
  });
});
