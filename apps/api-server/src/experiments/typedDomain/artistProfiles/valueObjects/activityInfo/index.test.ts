import { describe, it, expect } from "vitest";
import { createActivityInfo } from "./index";

describe("createActivityInfo", () => {
  it("正当なら ok(ActivityInfo) を返す", () => {
    const result = createActivityInfo("Active in Tokyo since 2015");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("ActivityInfo");
    }
  });

  it("空なら err を返す", () => {
    expect(createActivityInfo("").ok).toBe(false);
  });

  it("1000文字超なら err を返す", () => {
    expect(createActivityInfo("a".repeat(1001)).ok).toBe(false);
  });
});
