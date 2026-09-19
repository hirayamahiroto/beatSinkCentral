import { describe, it, expect } from "vitest";
import { createPresentationPatternCode } from "./index";

describe("createPresentationPatternCode", () => {
  it.each(["interview", "zoom_dive", "spotlight", "editorial"])(
    "固定コード %s で生成する",
    (code) => {
      expect(createPresentationPatternCode(code)).toStrictEqual({
        ok: true,
        value: code,
      });
    },
  );

  it("前後の空白を無視する", () => {
    expect(createPresentationPatternCode("  interview ")).toStrictEqual({
      ok: true,
      value: "interview",
    });
  });

  it("未知のコードは InvalidPresentationPatternError", () => {
    const result = createPresentationPatternCode("carousel");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidPresentationPatternError");
    }
  });
});
