import { describe, it, expect } from "vitest";
import { DEFAULT_PRESENTATION_PATTERN, toImmersivePatternCode } from "./index";

describe("toImmersivePatternCode", () => {
  it.each(["interview", "zoom_dive", "spotlight", "editorial"])(
    "UI 実装済みのコード %s はそのまま返す",
    (code) => {
      expect(toImmersivePatternCode(code)).toBe(code);
    },
  );

  it("UI 未実装のコードは undefined", () => {
    expect(toImmersivePatternCode("carousel")).toBeUndefined();
  });
});

describe("DEFAULT_PRESENTATION_PATTERN", () => {
  it("未選択時の既定は interview", () => {
    expect(DEFAULT_PRESENTATION_PATTERN).toBe("interview");
  });
});
