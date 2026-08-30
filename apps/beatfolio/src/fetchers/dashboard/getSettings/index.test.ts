import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings } from "./index";
import {
  NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../../shared/error";

const { getMock, createServerClientMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  return {
    getMock,
    createServerClientMock: vi.fn(() => ({
      api: { dashboard: { settings: { $get: getMock } } },
    })),
  };
});

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffServerClient: createServerClientMock,
}));

const screen = {
  registered: true,
  email: "saku@example.com",
  accountId: "saku",
};

describe("getSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cookie を引き継いで画面用データを ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => screen,
    });

    const result = await getSettings({ cookie: "appSession=abc" });

    expect(createServerClientMock).toHaveBeenCalledWith({
      cookie: "appSession=abc",
    });
    expect(result).toStrictEqual({ ok: true, value: screen });
  });

  it("BFF がエラーを返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Failed to fetch settings" }),
    });

    const result = await getSettings({ cookie: "appSession=abc" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "アカウント設定の取得に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await getSettings({ cookie: "appSession=abc" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });

  it("BFF が 401 を返したら unauthorized を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    const result = await getSettings({});

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unauthorized", message: SESSION_EXPIRED_MESSAGE },
    });
  });
});
