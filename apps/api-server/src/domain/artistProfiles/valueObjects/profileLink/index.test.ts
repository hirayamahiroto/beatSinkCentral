import { describe, it, expect } from "vitest";
import { createProfileLink } from "./index";

describe("createProfileLink", () => {
  it("linkTypeCode / url を保持する", () => {
    const result = createProfileLink({
      linkTypeCode: "youtube",
      url: "https://youtube.com/@taro",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        linkTypeCode: "youtube",
        url: "https://youtube.com/@taro",
      });
    }
  });

  it("linkTypeCode の前後空白は除去する", () => {
    const result = createProfileLink({
      linkTypeCode: " x ",
      url: "https://x.com/taro",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.linkTypeCode).toBe("x");
  });

  it("linkTypeCode が空なら err(InvalidProfileLinkFormatError)", () => {
    const result = createProfileLink({
      linkTypeCode: "",
      url: "https://x.com/taro",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileLinkFormatError");
    }
  });

  it("linkTypeCode が50文字超なら err(InvalidProfileLinkFormatError)", () => {
    const result = createProfileLink({
      linkTypeCode: "a".repeat(51),
      url: "https://x.com/taro",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileLinkFormatError");
    }
  });

  it("url が不正なら snsUrl のエラーが伝播する", () => {
    const result = createProfileLink({ linkTypeCode: "x", url: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});
