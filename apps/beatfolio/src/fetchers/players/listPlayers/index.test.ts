import { describe, it, expect, vi, beforeEach } from "vitest";
import { listPlayers } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("../../../utils/client/server", () => ({
  createBeatfolioBffServerClient: () => ({
    api: { players: { $get: getMock } },
  }),
}));

const players = [
  { id: "artist-1", name: "SAKU", handle: "saku" },
  { id: "artist-2", name: "RIN", handle: "rin" },
];

describe("listPlayers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら画面用データを ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ players }),
    });

    const result = await listPlayers();

    expect(result).toStrictEqual({ ok: true, value: { players } });
  });

  it("BFF がエラーを返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Failed to fetch players" }),
    });

    const result = await listPlayers();

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "プレイヤー一覧の取得に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await listPlayers();

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
