import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlayerConcept } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("../../../utils/client/server", () => ({
  createBeatfolioBffServerClient: () => ({
    api: { players: { ":handle": { concept: { $get: getMock } } } },
  }),
}));

const concept = {
  patternCode: "spotlight",
  name: "SAKU",
  tagline: null,
  heroImageUrl: "https://example.com/saku.jpg",
  genres: ["Beatbox"],
  activityInfo: null,
  chapters: [{ key: "beginning", label: "始まり", body: "始めたきっかけ。" }],
  links: [{ url: "https://youtube.com/@saku", label: "YouTube" }],
  primaryAction: null,
};

describe("getPlayerConcept", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handle を BFF へ渡し、成功したら没入ページ用データを ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => concept,
    });

    const result = await getPlayerConcept({ handle: "saku" });

    expect(getMock).toHaveBeenCalledWith({ param: { handle: "saku" } });
    expect(result).toStrictEqual({ ok: true, value: concept });
  });

  it("BFF が 404 を返したら notFound を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Player profile not found" }),
    });

    const result = await getPlayerConcept({ handle: "unknown" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "notFound",
        message: "このプレイヤーは見つかりませんでした",
      },
    });
  });

  it("BFF が 5xx を返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Upstream request failed" }),
    });

    const result = await getPlayerConcept({ handle: "saku" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "コンセプトページの取得に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await getPlayerConcept({ handle: "saku" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
