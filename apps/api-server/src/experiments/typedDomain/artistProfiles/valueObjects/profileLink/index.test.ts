import { describe, it, expect } from "vitest";
import { createProfileLink } from "./index";

describe("createProfileLink", () => {
  it("正当なら ok(ProfileLink) を返す", () => {
    const result = createProfileLink({
      type: "youtube",
      url: "https://youtube.com/@a",
      label: "YouTube",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("ProfileLink");
      expect(result.value.url).toBe("https://youtube.com/@a");
      expect(result.value.label).toBe("YouTube");
    }
  });

  it("label 未指定なら null になる（任意項目の正規化）", () => {
    const result = createProfileLink({
      type: "x",
      url: "https://x.com/a",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.label).toBeNull();
    }
  });

  it("type が空なら InvalidProfileLinkFormatError を返す", () => {
    const result = createProfileLink({ type: "", url: "https://x.com/a" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileLinkFormatError");
    }
  });

  it("url が不正なら SnsUrl のエラーが伝播する", () => {
    const result = createProfileLink({ type: "x", url: "not-a-url" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});
