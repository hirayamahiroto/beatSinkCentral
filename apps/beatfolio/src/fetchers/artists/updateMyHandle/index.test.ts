import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyHandle } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { $post: postMock } } },
  }),
}));

describe("updateMyHandle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const result = await updateMyHandle({ handle: "new_id" });

    expect(postMock).toHaveBeenCalledWith({ json: { handle: "new_id" } });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("409 はエラーメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "handle already taken" }),
    });

    const result = await updateMyHandle({ handle: "taken" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "handle already taken" },
    });
  });

  it("500 は unexpected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await updateMyHandle({ handle: "new_id" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "Handle の更新に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await updateMyHandle({ handle: "new_id" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
