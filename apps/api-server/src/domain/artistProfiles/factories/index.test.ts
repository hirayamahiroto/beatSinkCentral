import { describe, it, expect } from "vitest";
import { createArtistProfile, reconstructArtistProfile } from "./index";
import { toView, toPersistence, isPublished } from "../operations";

describe("createArtistProfile", () => {
  it("新規作成時は ID を生成し、初期状態は Draft（非公開）", () => {
    const profile = createArtistProfile({ artistId: "artist-1" });

    expect(profile.id).toBeTruthy();
    expect(profile.artistId).toBe("artist-1");
    expect(profile._tag).toBe("Draft");
    expect(isPublished(profile)).toBe(false);
  });

  it("空文字・空白のみのフィールドは null として扱う（下書き許容）", () => {
    const profile = createArtistProfile({
      artistId: "artist-1",
      name: "  ",
      story: "",
      genres: ["", "  "],
      links: [],
    });

    const view = toView(profile);
    expect(view.name).toBeNull();
    expect(view.story).toBeNull();
    expect(view.genres).toEqual([]);
    expect(view.links).toEqual([]);
  });

  it("値が入ったフィールドは view で取得できる", () => {
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

    const view = toView(profile);
    expect(view.name).toBe("Beatboxer Taro");
    expect(view.tagline).toBe("音で世界を旅する");
    expect(view.imageUrl).toBe("https://example.com/a.png");
    expect(view.genres).toEqual(["bass", "inward"]);
    expect(view.links).toEqual([
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
  it("published:true なら Published、false なら Draft を復元する", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: true,
      name: "Taro",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      genres: ["bass"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });

    expect(profile.id).toBe("profile-1");
    expect(profile._tag).toBe("Published");
    expect(isPublished(profile)).toBe(true);
    expect(toView(profile).name).toBe("Taro");
  });

  it("published:true なのに必須項目が欠けた永続化データはスローする（データ破損）", () => {
    expect(() =>
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    ).toThrow();
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

    expect(toPersistence(profile)).toEqual({
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
});
