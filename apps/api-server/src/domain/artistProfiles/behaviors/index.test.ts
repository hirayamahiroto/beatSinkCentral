import { describe, it, expect } from "vitest";
import { reconstructArtistProfile } from "../factories";

const profile = reconstructArtistProfile({
  id: "profile-1",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  tagline: "音で旅する",
  imageUrl: "https://example.com/a.png",
  chapters: [
    { questionCode: "turning_point", body: "転機" },
    { questionCode: "beginning", body: "私の歩み" },
  ],
  activityInfo: "東京 / ソロ",
  genres: ["bass", "inward"],
  links: [{ type: "x", url: "https://x.com/taro" }],
});

describe("createArtistProfileBehaviors", () => {
  it("getter がプリミティブ値を返す（内部の VO 構造を露出しない）", () => {
    expect(profile.getName()).toBe("Taro");
    expect(profile.getTagline()).toBe("音で旅する");
    expect(profile.getImageUrl()).toBe("https://example.com/a.png");
    expect(profile.getActivityInfo()).toBe("東京 / ソロ");
    expect(profile.getGenres()).toEqual(["bass", "inward"]);
    expect(profile.getLinks()).toEqual([
      { type: "x", url: "https://x.com/taro", label: null },
    ]);
    expect(profile.isPublished()).toBe(true);
  });

  it("getChapters は問いの固定順（始まり→転機→コンセプト）で並べ替えて返す", () => {
    expect(profile.getChapters()).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
      { questionCode: "turning_point", body: "転機" },
    ]);
  });

  it("toView はプレゼンテーション用のプレーンデータを返す", () => {
    expect(profile.toView()).toEqual({
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      chapters: [
        { questionCode: "beginning", body: "私の歩み" },
        { questionCode: "turning_point", body: "転機" },
      ],
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro", label: null }],
      published: true,
    });
  });

  it("unpublish は published=false の新しい Entity を返し、元は不変", () => {
    expect(profile.unpublish().isPublished()).toBe(false);
    expect(profile.isPublished()).toBe(true);
  });

  it("未設定フィールドは null もしくは空配列を返す", () => {
    const draft = reconstructArtistProfile({
      id: "profile-2",
      artistId: "artist-2",
      published: false,
    });
    expect(draft.getName()).toBeNull();
    expect(draft.getChapters()).toEqual([]);
    expect(draft.getGenres()).toEqual([]);
  });
});
