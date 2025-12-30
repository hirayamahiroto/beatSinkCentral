import { describe, it, expect } from "vitest";
import { createUsername } from "./index";

describe("isValidUsername", () => {
  it("有効なユーザー名を返す", () => {
    expect(createUsername("testuser").value).toBe("testuser");
  });

  it("無効なユーザー名を返す", () => {
    expect(() => createUsername("")).toThrow("Invalid username format");
    expect(() => createUsername("a".repeat(256))).toThrow(
      "Invalid username format"
    );
  });
});
