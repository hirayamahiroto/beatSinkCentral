import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboard } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { getMock, createServerClientMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  return {
    getMock,
    createServerClientMock: vi.fn(() => ({
      api: { dashboard: { $get: getMock } },
    })),
  };
});

vi.mock("../../../utils/client/server", () => ({
  createBeatfolioBffServerClient: createServerClientMock,
}));

const screen = {
  registered: true,
  artist: { handle: "saku", hasProfile: true },
};

describe("getDashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("画面用データを ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => screen,
    });

    const result = await getDashboard();

    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ ok: true, value: screen });
  });

  it("BFF がエラーを返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Failed to fetch dashboard" }),
    });

    const result = await getDashboard();

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "ダッシュボードの取得に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await getDashboard();

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
