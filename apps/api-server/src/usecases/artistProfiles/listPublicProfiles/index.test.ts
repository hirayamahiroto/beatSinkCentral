import { describe, it, expect, vi, beforeEach } from "vitest";
import { listPublicProfiles } from "./index";
import type { IArtistProfileReader } from "../../../domain/artistProfiles/repositories";
import type { PublicReadCapabilities } from "../../capabilities";

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
    },
  }) satisfies Pick<PublicReadCapabilities, "artistProfiles">;

describe("listPublicProfiles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールの一覧を ok(profiles) で返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.listPublishedSummaries.mockResolvedValue([
      {
        handle: "taro",
        name: "Taro",
        imageUrl: "https://e.com/a.png",
        tagline: "音で旅する",
        genres: ["bass"],
      },
      {
        handle: "hana",
        name: "Hana",
        imageUrl: null,
        tagline: null,
        genres: [],
      },
    ]);

    const result = await listPublicProfiles(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profiles).toHaveLength(2);
      expect(result.value.profiles[0].handle).toBe("taro");
      expect(result.value.profiles[1].imageUrl).toBeNull();
    }
  });

  it("公開プロフィールが無ければ空配列を返す", async () => {
    const caps = createCaps();

    const result = await listPublicProfiles(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profiles).toEqual([]);
    }
  });

  it("取得件数に上限を渡す", async () => {
    const caps = createCaps();

    await listPublicProfiles(caps);

    expect(caps.artistProfiles.listPublishedSummaries).toHaveBeenCalledWith({
      limit: 100,
    });
  });
});
