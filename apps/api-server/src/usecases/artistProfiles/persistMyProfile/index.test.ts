import { describe, it, expect, vi, beforeEach } from "vitest";
import { persistMyProfile } from "./index";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { ArtistWriteCapabilities } from "../../capabilities";

const publishableContent = {
  id: "profile-1",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

const echoUpsert = async (data: ArtistProfilePersistenceData) =>
  reconstructArtistProfile({ ...data });

const createCaps = () =>
  ({
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
  }) satisfies Pick<ArtistWriteCapabilities, "artistProfiles">;

describe("persistMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("集約の永続化データをそのまま upsert し、保存後の Entity を返す", async () => {
    const caps = createCaps();

    const saved = await persistMyProfile(
      caps,
      reconstructArtistProfile(publishableContent),
    );

    expect(caps.artistProfiles.upsert).toHaveBeenCalledExactlyOnceWith({
      id: "profile-1",
      artistId: "artist-1",
      name: "Taro",
      tagline: null,
      imageUrl: "https://example.com/taro.png",
      chapters: [{ questionCode: "beginning", body: "私の歩み" }],
      activityInfo: null,
      genres: ["bass"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      published: true,
    });
    expect(saved.isPublished()).toBe(true);
  });

  it("公開中に公開条件を割った集約は非公開へ降ろして保存する", async () => {
    const caps = createCaps();

    const saved = await persistMyProfile(
      caps,
      reconstructArtistProfile({ ...publishableContent, imageUrl: null }),
    );

    expect(caps.artistProfiles.upsert.mock.calls[0][0].published).toBe(false);
    expect(saved.isPublished()).toBe(false);
  });
});
