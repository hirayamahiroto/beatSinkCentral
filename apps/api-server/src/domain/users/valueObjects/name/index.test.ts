import { describe, it, expect } from "vitest";
import { createName } from "./index";

describe("createName", () => {
  it("有効な名前を返す", () => {
    const result = createName("testuser");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("testuser");
    }
  });

  it("無効な名前は err を返す", () => {
    expect(createName("").ok).toBe(false);
    expect(createName("a".repeat(256)).ok).toBe(false);
  });
});
