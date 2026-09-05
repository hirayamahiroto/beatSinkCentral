import { describe, it, expect } from "vitest";
import {
  createProfileAttributes,
  createProfileLinks,
  reconstructArtistProfile,
} from "../factories";
import { createStoryChapter } from "../valueObjects/storyChapter";
import { createImageUrl } from "../valueObjects/imageUrl";
import { unwrapOrThrow } from "../../../utils/result";

const expectOk = <T, E>(
  result: { ok: true; value: T } | { ok: false; error: E },
): T => unwrapOrThrow(result, "expected ok");

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
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
});

describe("createArtistProfileBehaviors", () => {
  it("getter がプリミティブ値を返す（内部の VO 構造を露出しない）", () => {
    expect(profile.getName()).toBe("Taro");
    expect(profile.getTagline()).toBe("音で旅する");
    expect(profile.getImageUrl()).toBe("https://example.com/a.png");
    expect(profile.getActivityInfo()).toBe("東京 / ソロ");
    expect(profile.getGenres()).toEqual(["bass", "inward"]);
    expect(profile.getLinks()).toStrictEqual([
      { linkTypeCode: "x", url: "https://x.com/taro" },
    ]);
    expect(profile.isPublished()).toBe(true);
  });

  it("getChapters は問いの固定順（始まり→転機→コンセプト）で並べ替えて返す", () => {
    expect(profile.getChapters()).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
      { questionCode: "turning_point", body: "転機" },
    ]);
  });

  it("toView は集約の構造（attributes / story / links / published）で返す", () => {
    expect(profile.toView()).toStrictEqual({
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

  describe("reviseAttributes", () => {
    it("属性だけを差し替え、画像・章・リンク・公開状態には触れない", () => {
      const revised = profile.reviseAttributes(
        expectOk(
          createProfileAttributes({
            name: "Jiro",
            tagline: null,
            genres: ["loop"],
            activityInfo: null,
          }),
        ),
      );

      expect(revised.getName()).toBe("Jiro");
      expect(revised.getTagline()).toBeNull();
      expect(revised.getGenres()).toEqual(["loop"]);
      expect(revised.getActivityInfo()).toBeNull();
      expect(revised.getImageUrl()).toBe("https://example.com/a.png");
      expect(revised.getChapters()).toEqual(profile.getChapters());
      expect(revised.getLinks()).toEqual(profile.getLinks());
      expect(revised.isPublished()).toBe(true);
      expect(profile.getName()).toBe("Taro");
    });
  });

  describe("writeStoryChapter", () => {
    it("同じ問いの章は上書きし、他の章は保持する", () => {
      const written = profile.writeStoryChapter(
        expectOk(
          createStoryChapter({ questionCode: "beginning", body: "書き直し" }),
        ),
      );

      expect(written.getChapters()).toEqual([
        { questionCode: "beginning", body: "書き直し" },
        { questionCode: "turning_point", body: "転機" },
      ]);
      expect(profile.getChapters()[0]?.body).toBe("私の歩み");
    });

    it("新しい問いの章は追加され、固定順に並ぶ", () => {
      const written = profile.writeStoryChapter(
        expectOk(
          createStoryChapter({
            questionCode: "concept",
            body: "表現したいこと",
          }),
        ),
      );

      expect(written.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
        { questionCode: "turning_point", body: "転機" },
        { questionCode: "concept", body: "表現したいこと" },
      ]);
    });
  });

  describe("clearStoryChapter", () => {
    it("指定した問いの章だけを消す", () => {
      const cleared = profile.clearStoryChapter("turning_point");

      expect(cleared.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
      ]);
    });

    it("存在しない問いを消しても他の章は変わらない", () => {
      expect(profile.clearStoryChapter("concept").getChapters()).toEqual(
        profile.getChapters(),
      );
    });
  });

  describe("replaceLinks", () => {
    it("リンク集合を丸ごと差し替え、順序は入力順を保つ", () => {
      const replaced = profile.replaceLinks(
        expectOk(
          createProfileLinks([
            { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
            { linkTypeCode: "x", url: "https://x.com/taro2" },
          ]),
        ),
      );

      expect(replaced.getLinks()).toStrictEqual([
        { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
        { linkTypeCode: "x", url: "https://x.com/taro2" },
      ]);
      expect(replaced.getName()).toBe("Taro");
    });

    it("空配列で全リンクを消せる", () => {
      expect(profile.replaceLinks([]).getLinks()).toEqual([]);
    });
  });

  describe("changeImage", () => {
    it("画像 URL だけを差し替える", () => {
      const changed = profile.changeImage(
        expectOk(createImageUrl("https://example.com/b.png")),
      );

      expect(changed.getImageUrl()).toBe("https://example.com/b.png");
      expect(changed.getName()).toBe("Taro");
      expect(profile.getImageUrl()).toBe("https://example.com/a.png");
    });
  });
});
