import { describe, it, expect } from "vitest";
import {
  createProfileAttributes,
  createProfileLinks,
  createDraftArtistProfile,
  reconstructArtistProfile,
} from "./index";
import { unwrapOrThrow } from "../../../utils/result";

const expectOk = <T, E>(
  result: { ok: true; value: T } | { ok: false; error: E },
): T => unwrapOrThrow(result, "expected ok");

describe("createProfileAttributes", () => {
  it("空文字・空白のみのフィールドは null / 空配列として扱う（下書き許容）", () => {
    const attributes = expectOk(
      createProfileAttributes({
        name: "  ",
        tagline: "",
        genres: ["", "  "],
        activityInfo: null,
      }),
    );

    expect(attributes.name).toBeNull();
    expect(attributes.tagline).toBeNull();
    expect(attributes.genres).toEqual([]);
    expect(attributes.activityInfo).toBeNull();
  });

  it("未指定のフィールドは null / 空配列になる", () => {
    const attributes = expectOk(createProfileAttributes({}));

    expect(attributes.name).toBeNull();
    expect(attributes.genres).toEqual([]);
  });

  it("値が入ったフィールドは VO として保持する", () => {
    const attributes = expectOk(
      createProfileAttributes({
        name: "Beatboxer Taro",
        tagline: "音で世界を旅する",
        genres: ["bass", "inward"],
        activityInfo: "東京 / ソロ",
      }),
    );

    expect(attributes.name?.value).toBe("Beatboxer Taro");
    expect(attributes.tagline?.value).toBe("音で世界を旅する");
    expect(attributes.genres.map((genre) => genre.value)).toEqual([
      "bass",
      "inward",
    ]);
    expect(attributes.activityInfo?.value).toBe("東京 / ソロ");
  });

  it("複数フィールドが不正なら最初の失敗で短絡する", () => {
    const result = createProfileAttributes({
      name: "a".repeat(256),
      tagline: "a".repeat(1000),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileNameFormatError");
    }
  });

  it("配列要素の不正も err として返る", () => {
    const result = createProfileAttributes({ genres: ["a".repeat(101)] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidGenreFormatError");
    }
  });
});

describe("createProfileLinks", () => {
  it("url が空のリンクは除外し、順序を保つ", () => {
    const links = expectOk(
      createProfileLinks([
        { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
        { linkTypeCode: "x", url: "  " },
        { linkTypeCode: "x", url: "https://x.com/taro" },
      ]),
    );

    expect(links).toStrictEqual([
      { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
      { linkTypeCode: "x", url: "https://x.com/taro" },
    ]);
  });

  it("不正な url は err(InvalidSnsUrlFormatError)", () => {
    const result = createProfileLinks([
      { linkTypeCode: "x", url: "not-a-url" },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});

describe("createDraftArtistProfile", () => {
  it("ID を生成し、全構造が空の非公開下書きを返す", () => {
    const profile = createDraftArtistProfile({ artistId: "artist-1" });

    expect(profile.getId()).toBeTruthy();
    expect(profile.getArtistId()).toBe("artist-1");
    expect(profile.isPublished()).toBe(false);
    expect(profile.toView()).toStrictEqual({
      attributes: {
        name: null,
        imageUrl: null,
        tagline: null,
        genres: [],
        activityInfo: null,
      },
      story: { chapters: [] },
      links: [],
      presentation: { patternCode: null },
      published: false,
    });
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
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
    });

    expect(profile.getId()).toBe("profile-1");
    expect(profile.isPublished()).toBe(true);
    expect(profile.getName()).toBe("Taro");
  });

  it("複数章を渡すと問いの固定順で並べ替えて保持する", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      chapters: [
        { questionCode: "concept", body: "表現したいこと" },
        { questionCode: "beginning", body: "始まり" },
        { questionCode: "turning_point", body: "転機" },
      ],
    });

    expect(profile.getChapters()).toEqual([
      { questionCode: "beginning", body: "始まり" },
      { questionCode: "turning_point", body: "転機" },
      { questionCode: "concept", body: "表現したいこと" },
    ]);
  });

  it("本文が空の章は保持しない", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      chapters: [{ questionCode: "beginning", body: "  " }],
    });

    expect(profile.getChapters()).toEqual([]);
  });

  it.each([
    ["不正な画像 URL", { imageUrl: "not-a-url" }],
    [
      "未知の questionCode",
      { chapters: [{ questionCode: "unknown", body: "本文" }] },
    ],
    [
      "questionCode の重複",
      {
        chapters: [
          { questionCode: "beginning", body: "1つ目" },
          { questionCode: "beginning", body: "2つ目" },
        ],
      },
    ],
    [
      "不正な url のリンク",
      { links: [{ linkTypeCode: "x", url: "not-a-url" }] },
    ],
  ])("%s を含む永続化データはスローする（データ破損）", (_, content) => {
    expect(() =>
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        ...content,
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
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
    });

    expect(profile.toPersistence()).toStrictEqual({
      id: "profile-1",
      artistId: "artist-1",
      name: "Taro",
      tagline: null,
      imageUrl: null,
      chapters: [],
      activityInfo: null,
      genres: ["bass", "inward"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      presentationPatternCode: null,
      published: false,
    });
  });

  it("presentationPatternCode を復元し、未知のコードは復元失敗として throw する", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      presentationPatternCode: "spotlight",
    });

    expect(profile.getPresentationPatternCode()).toBe("spotlight");
    expect(() =>
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        presentationPatternCode: "carousel",
      }),
    ).toThrow();
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
