import { describe, it, expect } from "vitest";
import {
  createProfileAttributes,
  createProfileLinks,
  reconstructStoredProfile,
} from "./index";
import { toView } from "../behaviors";
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

describe("reconstructStoredProfile", () => {
  it("published=false の行は draft として復元する", () => {
    const state = reconstructStoredProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      name: "Taro",
      genres: ["bass"],
    });

    expect(state.kind).toBe("draft");
    expect(state.id).toBe("profile-1");
    expect(state.artistId).toBe("artist-1");
    expect(state.content.name?.value).toBe("Taro");
  });

  it("published=true で最小核が揃った行は published として復元し、内容は非 null に絞られる", () => {
    const state = reconstructStoredProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: true,
      name: "Taro",
      imageUrl: "https://example.com/a.png",
      chapters: [{ questionCode: "beginning", body: "私の歩み" }],
      genres: ["bass"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
    });

    expect(state.kind).toBe("published");
    if (state.kind === "published") {
      expect(state.content.name.value).toBe("Taro");
      expect(state.content.links[0].url).toBe("https://x.com/taro");
    }
  });

  it("published=true なのに最小核が欠けた行はスローする（不変条件の破れ）", () => {
    expect(() =>
      reconstructStoredProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    ).toThrow("published profile lacks required fields");
  });

  it("複数章を渡しても toView は問いの固定順で並べる", () => {
    const state = reconstructStoredProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      chapters: [
        { questionCode: "concept", body: "表現したいこと" },
        { questionCode: "beginning", body: "始まり" },
        { questionCode: "turning_point", body: "転機" },
      ],
    });

    expect(toView(state).story.chapters).toEqual([
      { key: "beginning", body: "始まり" },
      { key: "turning_point", body: "転機" },
      { key: "concept", body: "表現したいこと" },
    ]);
  });

  it("本文が空の章は保持しない", () => {
    const state = reconstructStoredProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      chapters: [{ questionCode: "beginning", body: "  " }],
    });

    expect(state.content.chapters).toEqual([]);
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
    ["未知の presentationPatternCode", { presentationPatternCode: "carousel" }],
  ])("%s を含む永続化データはスローする（データ破損）", (_, content) => {
    expect(() =>
      reconstructStoredProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        ...content,
      }),
    ).toThrow("invalid field values");
  });

  it("presentationPatternCode を復元する", () => {
    const state = reconstructStoredProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      presentationPatternCode: "spotlight",
    });

    expect(state.content.presentationPattern).toBe("spotlight");
  });
});
