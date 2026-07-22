import { describe, it, expect } from "vitest";
import {
  assertProfilePublishable,
  collectMissingPublishFields,
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

describe("assertProfilePublishable", () => {
  it("最小核が揃っていれば何もスローしない", () => {
    const profile = reconstructArtistProfile(fullContent);
    expect(() => assertProfilePublishable(profile)).not.toThrow();
    expect(collectMissingPublishFields(profile)).toEqual([]);
  });

  it("不足フィールドがある場合は ProfileNotPublishableError をスローする", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      story: "",
      links: [],
    });

    expect(() => assertProfilePublishable(profile)).toThrow();
    try {
      assertProfilePublishable(profile);
    } catch (error) {
      expect(isProfileNotPublishableError(error)).toBe(true);
      if (isProfileNotPublishableError(error)) {
        expect(error.missingFields).toEqual(["story", "links"]);
      }
    }
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
