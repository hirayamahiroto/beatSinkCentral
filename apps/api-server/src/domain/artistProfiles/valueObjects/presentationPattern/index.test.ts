import { describe, it, expect } from "vitest";
import {
  createPresentationPatternCode,
  toPresentationPatternCode,
  PRESENTATION_PATTERN_CODES,
} from "./index";

describe("toPresentationPatternCode", () => {
  it("4 つの固定コードを返す", () => {
    for (const code of PRESENTATION_PATTERN_CODES) {
      expect(toPresentationPatternCode(code)).toBe(code);
    }
  });

  it("前後の空白を無視する", () => {
    expect(toPresentationPatternCode("  interview ")).toBe("interview");
  });

  it("未知のコードは undefined", () => {
    expect(toPresentationPatternCode("carousel")).toBeUndefined();
  });
});

describe("createPresentationPatternCode", () => {
  it("有効なコードで生成する", () => {
    expect(createPresentationPatternCode("editorial")).toStrictEqual({
      ok: true,
      value: "editorial",
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
