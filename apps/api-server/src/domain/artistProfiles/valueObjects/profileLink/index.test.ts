import { describe, it, expect } from "vitest";
import { createProfileLink } from "./index";

describe("createProfileLink", () => {
  it("type / url / label を保持する", () => {
    const result = createProfileLink({
      type: "youtube",
      url: "https://youtube.com/@taro",
      label: "メイン",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        type: "youtube",
        url: "https://youtube.com/@taro",
        label: "メイン",
      });
    }
  });

  it("label 未指定・空白は null に正規化する", () => {
    const omitted = createProfileLink({ type: "x", url: "https://x.com/taro" });
    const blank = createProfileLink({
      type: "x",
      url: "https://x.com/taro",
      label: "  ",
    });

    expect(omitted.ok).toBe(true);
    if (omitted.ok) expect(omitted.value.label).toBeNull();
    expect(blank.ok).toBe(true);
    if (blank.ok) expect(blank.value.label).toBeNull();
  });

  it("type が空なら err(InvalidProfileLinkFormatError)", () => {
    const result = createProfileLink({ type: "", url: "https://x.com/taro" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileLinkFormatError");
    }
  });

  it("label が100文字超なら err(InvalidProfileLinkFormatError)", () => {
    const result = createProfileLink({
      type: "x",
      url: "https://x.com/taro",
      label: "a".repeat(101),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileLinkFormatError");
    }
  });

  it("url が不正なら snsUrl のエラーが伝播する", () => {
    const result = createProfileLink({ type: "x", url: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});
