import { describe, it, expect } from "vitest";
import {
  collectMissingPublishFields,
  createProfileNotPublishableError,
  isProfileNotPublishableError,
} from "./index";
import { reconstructArtistProfile } from "../../factories";

const fullContent = {
  id: "profile-1",
  artistId: "artist-1",
  published: false,
  name: "Taro",
  imageUrl: "https://example.com/a.png",
  story: "私の歩み",
  genres: ["bass"],
  links: [{ type: "x", url: "https://x.com/taro" }],
};

describe("collectMissingPublishFields", () => {
  it("最小核が揃っていれば空配列を返す", () => {
    const profile = reconstructArtistProfile(fullContent);

    expect(collectMissingPublishFields(profile)).toEqual([]);
  });

  it("不足しているフィールド名を列挙する", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      story: "",
      links: [],
    });

    expect(collectMissingPublishFields(profile)).toEqual(["story", "links"]);
  });

  it("タグライン・活動情報は公開ゲート対象外", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      tagline: undefined,
      activityInfo: undefined,
    });

    expect(collectMissingPublishFields(profile)).toEqual([]);
  });
});

describe("ProfileNotPublishableError", () => {
  it("不足フィールドを保持した Error を生成する", () => {
    const error = createProfileNotPublishableError(["story", "links"]);

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ProfileNotPublishableError");
    expect(error.missingFields).toEqual(["story", "links"]);
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(
      isProfileNotPublishableError(createProfileNotPublishableError([])),
    ).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isProfileNotPublishableError(new Error("boom"))).toBe(false);
    expect(
      isProfileNotPublishableError({ type: "ProfileNotPublishableError" }),
    ).toBe(false);
    expect(isProfileNotPublishableError(null)).toBe(false);
  });
});
