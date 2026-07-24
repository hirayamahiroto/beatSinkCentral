import { describe, it, expect } from "vitest";
import { resolveLinkType } from "./index";
import { createLinkType, type LinkType } from "../../linkType";
import { createLinkTypeCode } from "../../valueObjects/linkTypeCode";

const buildMaster = (): LinkType[] => {
  const youtube = createLinkType({ code: "youtube", label: "YouTube" });
  const x = createLinkType({ code: "x", label: "X" });
  if (!youtube.ok || !x.ok) throw new Error("fixture invalid");
  return [youtube.value, x.value];
};

describe("resolveLinkType", () => {
  it("code が一致するマスタを解決して返す", () => {
    const code = createLinkTypeCode("youtube");
    if (!code.ok) throw new Error("fixture invalid");

    const result = resolveLinkType(buildMaster(), code.value);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.label).toBe("YouTube");
      expect(result.value.code.value).toBe("youtube");
    }
  });

  it("一致するマスタが無ければ LinkTypeNotFoundError を返す", () => {
    const code = createLinkTypeCode("unknown");
    if (!code.ok) throw new Error("fixture invalid");

    const result = resolveLinkType(buildMaster(), code.value);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("LinkTypeNotFoundError");
    }
  });
});
