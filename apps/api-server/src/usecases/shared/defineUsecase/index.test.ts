import { describe, it, expect, vi } from "vitest";
import { defineUsecase } from "./index";
import type { Actor, ReadCapabilities } from "../../capabilities";

type Caps = Pick<ReadCapabilities, "artistProfiles">;

const artistProfiles = {
  findByArtistId: vi.fn(async () => null),
  findPublishedByAccountId: vi.fn(async () => null),
};

const countProfiles = defineUsecase<Caps, number, { artistId: string }>(
  async (caps, input) => {
    const profile = await caps.artistProfiles.findByArtistId(input.artistId);
    return profile === null ? 0 : 1;
  },
);

const listAll = defineUsecase<Caps, string>(async () => "listed");

describe("defineUsecase", () => {
  it("ちょうどの caps と input で実行できる", async () => {
    await expect(
      countProfiles({ artistProfiles }, { artistId: "artist-1" }),
    ).resolves.toBe(0);
    expect(artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
  });

  it("Input を省略すると caps だけを取る query になる", async () => {
    await expect(listAll({ artistProfiles })).resolves.toBe("listed");
  });
});

// 型レベルの制約。実行はせず tsc で固定する（vitest は型を見ない）。
const _typeConstraints = () => {
  const container = { actor: {} as Actor, artistProfiles };

  // @ts-expect-error actor は Caps に無いため弾かれる
  void countProfiles(container, { artistId: "artist-1" });

  // @ts-expect-error スプレッドでも余剰キーは素通りしない
  void countProfiles({ ...container }, { artistId: "artist-1" });

  // @ts-expect-error artistProfiles が無い
  void countProfiles({}, { artistId: "artist-1" });
};
void _typeConstraints;
