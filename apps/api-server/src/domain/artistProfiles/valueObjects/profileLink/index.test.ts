import { describe, it, expect } from "vitest";
import { createProfileLink } from "./index";

describe("createProfileLink", () => {
  it("type / url / label を保持する", () => {
    const link = createProfileLink({
      type: "youtube",
      url: "https://youtube.com/@taro",
      label: "メイン",
    });
    expect(link).toEqual({
      _tag: "ProfileLink",
      type: "youtube",
      url: "https://youtube.com/@taro",
      label: "メイン",
    });
  });

  it("label 未指定・空白は null に正規化する", () => {
    expect(
      createProfileLink({ type: "x", url: "https://x.com/taro" }).label,
    ).toBeNull();
    expect(
      createProfileLink({ type: "x", url: "https://x.com/taro", label: "  " })
        .label,
    ).toBeNull();
  });

  it("type が空ならエラー", () => {
    expect(() =>
      createProfileLink({ type: "", url: "https://x.com/taro" }),
    ).toThrowError(
      expect.objectContaining({ type: "InvalidProfileLinkFormatError" }),
    );
  });

  it("url が不正なら snsUrl のエラーになる", () => {
    expect(() =>
      createProfileLink({ type: "x", url: "not-a-url" }),
    ).toThrowError(
      expect.objectContaining({ type: "InvalidSnsUrlFormatError" }),
    );
  });
});
