import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeMyStoryChapter } from "./index";
import { reconstructStoredProfile } from "../../../domain/artistProfiles/factories";
import { toPersistence } from "../../../domain/artistProfiles/behaviors";
import type { ProfileState } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { ArtistWriteCapabilities } from "../../../capabilities";
import { testUser, testArtist } from "../../../authorization/testDoubles";

const actor = { user: testUser, artist: testArtist };

const publishedContent = {
  id: "profile-existing",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

const createCaps = (
  state: ProfileState = { kind: "noProfile", artistId: "artist-1" },
) =>
  ({
    actor,
    artistProfiles: {
      load: vi.fn<IArtistProfileReader["load"]>(async () => state),
      findPublishedByHandle: vi.fn<
        IArtistProfileReader["findPublishedByHandle"]
      >(async () => null),
      listPublishedSummaries: vi.fn<
        IArtistProfileReader["listPublishedSummaries"]
      >(async () => []),
      save: vi.fn<IArtistProfileWriter["save"]>(async (saved) => saved),
      publish: vi.fn<IArtistProfileWriter["publish"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("writeMyStoryChapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを起こして章を書き、story だけを返す", async () => {
    const caps = createCaps();

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "beginning",
      body: "始めたきっかけ",
    });

    expect(result).toStrictEqual({
      ok: true,
      value: {
        story: { chapters: [{ key: "beginning", body: "始めたきっかけ" }] },
      },
    });
    const saved = toPersistence(caps.artistProfiles.save.mock.calls[0][0]);
    expect(saved.artistId).toBe("artist-1");
    expect(saved.chapters).toEqual([
      { questionCode: "beginning", body: "始めたきっかけ" },
    ]);
  });

  it("既存の章は上書きし、他の章・属性・リンク・公開状態は保持する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "turning_point",
      body: "新しい転機",
    });

    const saved = toPersistence(caps.artistProfiles.save.mock.calls[0][0]);
    expect(saved.id).toBe("profile-existing");
    expect(saved.chapters).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
      { questionCode: "turning_point", body: "新しい転機" },
    ]);
    expect(saved.name).toBe("Taro");
    expect(saved.links).toEqual([
      { linkTypeCode: "x", url: "https://x.com/taro" },
    ]);
    expect(saved.published).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.story.chapters).toEqual([
        { key: "beginning", body: "私の歩み" },
        { key: "turning_point", body: "新しい転機" },
      ]);
    }
  });

  it("本文が空なら章を消す", async () => {
    const caps = createCaps(
      reconstructStoredProfile({
        ...publishedContent,
        chapters: [
          { questionCode: "beginning", body: "私の歩み" },
          { questionCode: "turning_point", body: "転機" },
        ],
      }),
    );

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "turning_point",
      body: "   ",
    });

    expect(
      toPersistence(caps.artistProfiles.save.mock.calls[0][0]).chapters,
    ).toEqual([{ questionCode: "beginning", body: "私の歩み" }]);
    expect(result.ok).toBe(true);
  });

  it("公開中に必須の章（始まり）を消したら下書きに落として保存する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    await writeMyStoryChapter(caps, { chapterKey: "beginning", body: "" });

    expect(caps.artistProfiles.save.mock.calls[0][0].kind).toBe("draft");
  });

  it("未知の chapterKey は err(InvalidStoryChapterFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "unknown",
      body: "本文",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidStoryChapterFormatError");
    }
    expect(caps.artistProfiles.load).not.toHaveBeenCalled();
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });

  it("本文が上限を超えたら err(InvalidStoryChapterFormatError)（保存しない）", async () => {
    const caps = createCaps();

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "beginning",
      body: "a".repeat(10001),
    });

    expect(result.ok).toBe(false);
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
