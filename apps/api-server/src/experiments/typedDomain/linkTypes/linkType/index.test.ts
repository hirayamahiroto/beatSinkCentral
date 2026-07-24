import { describe, it, expect } from "vitest";
import { createLinkType } from "./index";

describe("createLinkType", () => {
  it("code/label が正当なら ok(LinkType) を返す", () => {
    const result = createLinkType({ code: "youtube", label: "YouTube" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.code.value).toBe("youtube");
      expect(result.value.code._tag).toBe("LinkTypeCode");
      expect(result.value.label).toBe("YouTube");
    }
  });

  it("label が空なら InvalidLinkTypeLabelError を型付きで返す", () => {
    const result = createLinkType({ code: "youtube", label: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidLinkTypeLabelError");
    }
  });

  it("code が空なら InvalidLinkTypeCodeError を型付きで返す", () => {
    const result = createLinkType({ code: "", label: "YouTube" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidLinkTypeCodeError");
    }
  });
});
