import { describe, it, expect } from "vitest";
import { createLinkTypeCode, type LinkTypeCode } from "./index";

describe("createLinkTypeCode", () => {
  it("空でなければ ok(LinkTypeCode) を返す", () => {
    const result = createLinkTypeCode(" youtube ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("youtube");
      expect(result.value._tag).toBe("LinkTypeCode");
    }
  });

  it("空白のみなら throw せず err を返す", () => {
    const result = createLinkTypeCode("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidLinkTypeCodeError");
    }
  });

  it("素の string は LinkTypeCode に代入できない（コンパイル時にブランドで弾く）", () => {
    // @ts-expect-error string は _tag を持たないため LinkTypeCode に代入不可
    const _code: LinkTypeCode = "youtube";
    void _code;
  });
});
