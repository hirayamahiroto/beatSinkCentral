import { describe, it, expect } from "vitest";
import {
  changeImage,
  choosePresentationPattern,
  clearStoryChapter,
  draftIfAbsent,
  replaceLinks,
  reviseAttributes,
  toPersistence,
  toView,
  unpublish,
  writeStoryChapter,
} from "./index";
import {
  createProfileAttributes,
  createProfileLinks,
  reconstructStoredProfile,
} from "../factories";
import { createStoryChapter } from "../valueObjects/storyChapter";
import { createImageUrl } from "../valueObjects/imageUrl";
import { unwrapOrThrow } from "../../../utils/result";

const expectOk = <T, E>(
  result: { ok: true; value: T } | { ok: false; error: E },
): T => unwrapOrThrow(result, "expected ok");

const published = reconstructStoredProfile({
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
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
});

const content = published.content;

describe("draftIfAbsent", () => {
  it("noProfile は ID を生成した全構造が空の下書きに起こす", () => {
    const draft = draftIfAbsent({ kind: "noProfile", artistId: "artist-2" });

    expect(draft.kind).toBe("draft");
    expect(draft.id).toBeTruthy();
    expect(draft.artistId).toBe("artist-2");
    expect(toView(draft)).toStrictEqual({
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

  it("存在する状態はそのまま返す", () => {
    expect(draftIfAbsent(published)).toBe(published);
  });
});

describe("内容の書き換え（状態に無関心な純粋関数）", () => {
  it("reviseAttributes は属性だけを差し替え、画像・章・リンクには触れない", () => {
    const revised = reviseAttributes(
      content,
      expectOk(
        createProfileAttributes({
          name: "Jiro",
          tagline: null,
          genres: ["loop"],
          activityInfo: null,
        }),
      ),
    );

    expect(revised.name?.value).toBe("Jiro");
    expect(revised.tagline).toBeNull();
    expect(revised.genres.map((genre) => genre.value)).toEqual(["loop"]);
    expect(revised.activityInfo).toBeNull();
    expect(revised.imageUrl).toBe(content.imageUrl);
    expect(revised.chapters).toBe(content.chapters);
    expect(revised.links).toBe(content.links);
    expect(content.name?.value).toBe("Taro");
  });

  it("writeStoryChapter は同じ問いの章を上書きし、他の章は保持する", () => {
    const written = writeStoryChapter(
      content,
      expectOk(
        createStoryChapter({ questionCode: "beginning", body: "書き直し" }),
      ),
    );

    expect(
      written.chapters.map((chapter) => [chapter.questionCode, chapter.body]),
    ).toEqual([
      ["turning_point", "転機"],
      ["beginning", "書き直し"],
    ]);
  });

  it("clearStoryChapter は指定した問いの章だけを消す", () => {
    const cleared = clearStoryChapter(content, "turning_point");

    expect(cleared.chapters.map((chapter) => chapter.questionCode)).toEqual([
      "beginning",
    ]);
    expect(clearStoryChapter(content, "concept").chapters).toEqual(
      content.chapters,
    );
  });

  it("replaceLinks はリンク集合を丸ごと差し替え、入力順を保つ", () => {
    const replaced = replaceLinks(
      content,
      expectOk(
        createProfileLinks([
          { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
          { linkTypeCode: "x", url: "https://x.com/taro2" },
        ]),
      ),
    );

    expect(replaced.links.map((link) => link.linkTypeCode)).toEqual([
      "youtube",
      "x",
    ]);
    expect(replaceLinks(content, []).links).toEqual([]);
  });

  it("choosePresentationPattern / changeImage はその構造だけを差し替える", () => {
    expect(
      choosePresentationPattern(content, "editorial").presentationPattern,
    ).toBe("editorial");
    expect(
      changeImage(
        content,
        expectOk(createImageUrl("https://example.com/b.png")),
      ).imageUrl?.value,
    ).toBe("https://example.com/b.png");
    expect(content.presentationPattern).toBeNull();
  });
});

describe("unpublish", () => {
  it("公開中から ID と内容を保ったまま下書きへ戻す", () => {
    if (published.kind !== "published") throw new Error("fixture");

    const draft = unpublish(published);

    expect(draft).toStrictEqual({
      kind: "draft",
      id: "profile-1",
      artistId: "artist-1",
      content: published.content,
    });
  });
});

describe("toView / toPersistence", () => {
  it("toView は集約の構造で返し、章は問いの固定順に並べ、published は kind から決める", () => {
    expect(toView(published)).toStrictEqual({
      attributes: {
        name: "Taro",
        imageUrl: "https://example.com/a.png",
        tagline: "音で旅する",
        genres: ["bass", "inward"],
        activityInfo: "東京 / ソロ",
      },
      story: {
        chapters: [
          { key: "beginning", body: "私の歩み" },
          { key: "turning_point", body: "転機" },
        ],
      },
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      presentation: { patternCode: null },
      published: true,
    });
  });

  it("toPersistence はプリミティブな永続化データを返す", () => {
    expect(toPersistence(published)).toStrictEqual({
      id: "profile-1",
      artistId: "artist-1",
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      chapters: [
        { questionCode: "beginning", body: "私の歩み" },
        { questionCode: "turning_point", body: "転機" },
      ],
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      presentationPatternCode: null,
      published: true,
    });
  });
});
