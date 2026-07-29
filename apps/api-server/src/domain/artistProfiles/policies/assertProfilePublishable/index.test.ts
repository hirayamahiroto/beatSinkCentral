import { describe, it, expect } from "vitest";
import { collectMissingPublishFields, isPublishable } from "./index";
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
    expect(
      collectMissingPublishFields(reconstructArtistProfile(fullContent)),
    ).toEqual([]);
  });

  it("不足フィールドを列挙する", () => {
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

describe("isPublishable", () => {
  it("最小核が揃っていれば true を返し、必須項目が非 null に絞り込まれる", () => {
    const profile = reconstructArtistProfile(fullContent);

    expect(isPublishable(profile)).toBe(true);
    if (isPublishable(profile)) {
      expect(profile.name.value).toBe("Taro");
      expect(profile.story.value).toBe("私の歩み");
      expect(profile.genres[0].value).toBe("bass");
      expect(profile.links[0].url).toBe("https://x.com/taro");
    }
  });

  it("最小核が欠けていれば false を返す", () => {
    const profile = reconstructArtistProfile({ ...fullContent, links: [] });

    expect(isPublishable(profile)).toBe(false);
  });
});
