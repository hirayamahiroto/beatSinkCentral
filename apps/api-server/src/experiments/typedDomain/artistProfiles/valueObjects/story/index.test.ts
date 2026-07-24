import { describe, it, expect } from "vitest";
import { createStory } from "./index";

describe("createStory", () => {
  it("正当なら ok(Story) を返す", () => {
    const result = createStory("I started beatboxing in 2010.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("Story");
    }
  });

  it("空なら err を返す", () => {
    expect(createStory("").ok).toBe(false);
  });

  it("10000文字超なら err を返す", () => {
    expect(createStory("a".repeat(10001)).ok).toBe(false);
  });
});
