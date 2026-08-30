import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboarding } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { getMock, createServerClientMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  return {
    getMock,
    createServerClientMock: vi.fn(() => ({
      api: { onboarding: { $get: getMock } },
    })),
  };
});

vi.mock("../../../utils/client/server", () => ({
  createBeatfolioBffServerClient: createServerClientMock,
}));

describe("getOnboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("登録状態を ok で返す", async () => {
    getMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const result = await getOnboarding();

    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ ok: true, value: { registered: false } });
  });

  it("BFF がエラーを返したら unexpected を返す", async () => {
    getMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Failed to fetch onboarding" }),
    });

    const result = await getOnboarding();

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "オンボーディング状態の取得に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    getMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await getOnboarding();

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
