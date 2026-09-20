import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishMyProfile } from "./index";
import { reconstructStoredProfile } from "../../../domain/artistProfiles/factories";
import type { ProfileState } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { ArtistWriteCapabilities } from "../../../capabilities";
import { testUser, testArtist } from "../../../authorization/testDoubles";

const actor = { user: testUser, artist: testArtist };

const publishable = (published: boolean) =>
  reconstructStoredProfile({
    id: "profile-1",
    artistId: "artist-1",
    published,
    name: "Taro",
    imageUrl: "https://example.com/a.png",
    chapters: [{ questionCode: "beginning", body: "私の歩み" }],
    genres: ["bass"],
    links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
  });

const createCaps = (state: ProfileState) =>
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
      publish: vi.fn<IArtistProfileWriter["publish"]>(async (saved) => saved),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("publishMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("最小核が揃った下書きは公開し、ok(published=true) を返す", async () => {
    const caps = createCaps(publishable(false));

    const result = await publishMyProfile(caps, { published: true });

    expect(result).toStrictEqual({ ok: true, value: { published: true } });
    expect(caps.artistProfiles.load).toHaveBeenCalledExactlyOnceWith(
      "artist-1",
    );
    const published = caps.artistProfiles.publish.mock.calls[0][0];
    expect(published.kind).toBe("published");
    expect(published.id).toBe("profile-1");
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });

  it("最小核が欠けた下書きを公開しようとすると err(ProfileNotPublishableError)", async () => {
    const caps = createCaps(
      reconstructStoredProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        links: [],
      }),
    );

    const result = await publishMyProfile(caps, { published: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileNotPublishableError");
      expect(result.error).toMatchObject({
        missingFields: ["imageUrl", "story", "genres", "links"],
      });
    }
    expect(caps.artistProfiles.publish).not.toHaveBeenCalled();
  });

  it("公開中を非公開にすると下書きとして保存し、ok(published=false) を返す", async () => {
    const caps = createCaps(publishable(true));

    const result = await publishMyProfile(caps, { published: false });

    expect(result).toStrictEqual({ ok: true, value: { published: false } });
    const saved = caps.artistProfiles.save.mock.calls[0][0];
    expect(saved.kind).toBe("draft");
    expect(saved.id).toBe("profile-1");
    expect(caps.artistProfiles.publish).not.toHaveBeenCalled();
  });

  it("すでに目的の状態なら書き込まずにその状態を返す（冪等）", async () => {
    const alreadyPublished = createCaps(publishable(true));
    const alreadyDraft = createCaps(publishable(false));

    expect(
      await publishMyProfile(alreadyPublished, { published: true }),
    ).toStrictEqual({ ok: true, value: { published: true } });
    expect(
      await publishMyProfile(alreadyDraft, { published: false }),
    ).toStrictEqual({ ok: true, value: { published: false } });
    expect(alreadyPublished.artistProfiles.publish).not.toHaveBeenCalled();
    expect(alreadyPublished.artistProfiles.save).not.toHaveBeenCalled();
    expect(alreadyDraft.artistProfiles.save).not.toHaveBeenCalled();
  });

  it("プロフィール未作成なら err(ArtistProfileNotFoundError)", async () => {
    const caps = createCaps({ kind: "noProfile", artistId: "artist-1" });

    const result = await publishMyProfile(caps, { published: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistProfileNotFoundError");
    }
    expect(caps.artistProfiles.publish).not.toHaveBeenCalled();
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
