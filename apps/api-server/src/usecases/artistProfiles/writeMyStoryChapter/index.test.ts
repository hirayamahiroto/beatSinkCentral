import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeMyStoryChapter } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { Actor, ArtistWriteCapabilities } from "../../capabilities";

const actor: Actor = {
  user: reconstructUser({
    id: "user-1",
    subId: "auth0|123",
    email: "test@example.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    handle: "beatboxer_taro",
    ownerUserId: "user-1",
    profile: null,
  }),
};

const publishedContent = {
  id: "profile-existing",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [
    { questionCode: "beginning", body: "私の歩み" },
    { questionCode: "turning_point", body: "転機" },
  ],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

const echoUpsert = async (data: ArtistProfilePersistenceData) =>
  reconstructArtistProfile({ ...data });

const createCaps = () =>
  ({
    actor,
    artistProfiles: {
      findByArtistId: vi.fn<IArtistProfileReader["findByArtistId"]>(
        async () => null,
      ),
      findPublishedByHandle: vi.fn<
        IArtistProfileReader["findPublishedByHandle"]
      >(async () => null),
      listPublishedSummaries: vi.fn<
        IArtistProfileReader["listPublishedSummaries"]
      >(async () => []),
      upsert: vi.fn<IArtistProfileWriter["upsert"]>(echoUpsert),
      setPublished: vi.fn<IArtistProfileWriter["setPublished"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("writeMyStoryChapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを作って章を書き、story だけを返す", async () => {
    const caps = createCaps();

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "beginning",
      body: "始めたきっかけ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        story: { chapters: [{ key: "beginning", body: "始めたきっかけ" }] },
      });
    }
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.artistId).toBe("artist-1");
    expect(persisted.chapters).toEqual([
      { questionCode: "beginning", body: "始めたきっかけ" },
    ]);
  });

  it("既存の章は上書きし、他の章・属性・リンク・公開状態は保持する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile(publishedContent),
    );

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "turning_point",
      body: "新しい転機",
    });

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.id).toBe("profile-existing");
    expect(persisted.chapters).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
      { questionCode: "turning_point", body: "新しい転機" },
    ]);
    expect(persisted.name).toBe("Taro");
    expect(persisted.links).toEqual([
      { linkTypeCode: "x", url: "https://x.com/taro" },
    ]);
    expect(persisted.published).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.story.chapters).toEqual([
        { key: "beginning", body: "私の歩み" },
        { key: "turning_point", body: "新しい転機" },
      ]);
    }
  });

  it("本文が空なら章を消す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile(publishedContent),
    );

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "turning_point",
      body: "   ",
    });

    expect(caps.artistProfiles.upsert.mock.calls[0][0].chapters).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.story.chapters).toEqual([
        { key: "beginning", body: "私の歩み" },
      ]);
    }
  });

  it("公開中に必須の章（始まり）を消したら非公開へ降ろして保存する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile(publishedContent),
    );

    await writeMyStoryChapter(caps, { chapterKey: "beginning", body: "" });

    expect(caps.artistProfiles.upsert.mock.calls[0][0].published).toBe(false);
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
    expect(caps.artistProfiles.findByArtistId).not.toHaveBeenCalled();
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("本文が上限を超えたら err(InvalidStoryChapterFormatError)（保存しない）", async () => {
    const caps = createCaps();

    const result = await writeMyStoryChapter(caps, {
      chapterKey: "beginning",
      body: "a".repeat(10001),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidStoryChapterFormatError");
    }
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });
});
