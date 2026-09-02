import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlayerDetail } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("../../../utils/client/server", () => ({
  createBeatfolioBffServerClient: () => ({
    api: { players: { ":handle": { $get: getMock } } },
  }),
}));

const player = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  imageUrl: "https://example.com/saku.jpg",
  genres: ["Beatbox"],
  storyChapters: [{ question: "Story", body: "始めたきっかけ。" }],
  translation: null,
  listeningPoint: null,
  offer: null,
  supportLinks: [{ url: "https://youtube.com/@saku", label: "YouTube" }],
};

describe("getPlayerDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handle を BFF へ渡し、成功したら画面用データを ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => player,
    });

    const result = await getPlayerDetail({ handle: "saku" });

    expect(getMock).toHaveBeenCalledWith({ param: { handle: "saku" } });
    expect(result).toStrictEqual({ ok: true, value: player });
  });

  it("BFF が 404 を返したら notFound を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Player profile not found" }),
    });

    const result = await getPlayerDetail({ handle: "unknown" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "notFound",
        message: "このプレイヤーは見つかりませんでした",
      },
    });
  });

  it("BFF がその他のエラーを返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Failed to fetch player profile" }),
    });

    const result = await getPlayerDetail({ handle: "saku" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "プレイヤーの取得に失敗しました",
      },
    });
  });

  it("通信自体が失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("fetch failed"));

    const result = await getPlayerDetail({ handle: "saku" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
