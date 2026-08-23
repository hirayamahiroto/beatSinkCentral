import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyEmail } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { users: { me: { $post: postMock } } },
  }),
}));

describe("updateMyEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: "user-1", email: "new@example.com" }),
    });

    const result = await updateMyEmail({ email: "new@example.com" });

    expect(postMock).toHaveBeenCalledWith({
      json: { email: "new@example.com" },
    });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("409 はエラーメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Email already taken" }),
    });

    const result = await updateMyEmail({ email: "taken@example.com" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Email already taken" },
    });
  });

  it("エラー本文が無ければフォールバックメッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    });

    const result = await updateMyEmail({ email: "x@example.com" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "rejected",
        message: "メールアドレスの更新に失敗しました",
      },
    });
  });

  it("入力値に紐づかない 4xx（認証切れ等）は unexpected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    const result = await updateMyEmail({ email: "x@example.com" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "Unauthorized" },
    });
  });

  it("500 は unexpected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await updateMyEmail({ email: "x@example.com" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "メールアドレスの更新に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await updateMyEmail({ email: "x@example.com" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
