import { describe, it, expect } from "vitest";
import { createArtistProfile, reconstructArtistProfile } from "./index";

describe("createArtistProfile", () => {
  it("新規作成時は ID を生成し、初期状態は非公開", () => {
    const profile = createArtistProfile({ artistId: "artist-1" });

    expect(profile.getId()).toBeTruthy();
    expect(profile.getArtistId()).toBe("artist-1");
    expect(profile.isPublished()).toBe(false);
  });

  it("空文字・空白のみのフィールドは null として扱う（下書き許容）", () => {
    const profile = createArtistProfile({
      artistId: "artist-1",
      name: "  ",
      story: "",
      genres: ["", "  "],
      links: [],
    });

    expect(profile.getName()).toBeNull();
    expect(profile.getStory()).toBeNull();
    expect(profile.getGenres()).toEqual([]);
    expect(profile.getLinks()).toEqual([]);
  });

  it("値が入ったフィールドは振る舞いで取得できる", () => {
    const profile = createArtistProfile({
      artistId: "artist-1",
      name: "Beatboxer Taro",
      tagline: "音で世界を旅する",
      imageUrl: "https://example.com/a.png",
      story: "幼少期から…",
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });

    expect(profile.getName()).toBe("Beatboxer Taro");
    expect(profile.getTagline()).toBe("音で世界を旅する");
    expect(profile.getImageUrl()).toBe("https://example.com/a.png");
    expect(profile.getGenres()).toEqual(["bass", "inward"]);
    expect(profile.getLinks()).toEqual([
      { type: "x", url: "https://x.com/taro", label: null },
    ]);
  });

  it("不正な画像 URL はエラーをスローする", () => {
    expect(() =>
      createArtistProfile({ artistId: "artist-1", imageUrl: "not-a-url" }),
    ).toThrow();
  });
});

describe("reconstructArtistProfile", () => {
  it("ID と published を引数から復元する", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: true,
      name: "Taro",
      genres: ["bass"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });

    expect(profile.getId()).toBe("profile-1");
    expect(profile.isPublished()).toBe(true);
    expect(profile.getName()).toBe("Taro");
  });

  it("toPersistence はプリミティブな永続化データを返す", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      name: "Taro",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });

    expect(profile.toPersistence()).toEqual({
      id: "profile-1",
      artistId: "artist-1",
      name: "Taro",
      tagline: null,
      imageUrl: null,
      story: null,
      activityInfo: null,
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro", label: null }],
      published: false,
    });
  });

  it("publish() は published を true にした新しい Entity を返す", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
    });

    expect(profile.publish().isPublished()).toBe(true);
    expect(profile.isPublished()).toBe(false);
  });
});
