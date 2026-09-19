import { describe, it, expect, vi, beforeEach } from "vitest";
import { choosePresentationPattern } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { presentation: { $post: postMock } } } },
  }),
}));

describe("choosePresentationPattern", () => {
  beforeEach(() => vi.clearAllMocks());

  it("patternCode を BFF へ送り、成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ presentation: { patternCode: "editorial" } }),
    });

    const result = await choosePresentationPattern({
      patternCode: "editorial",
    });

    expect(postMock).toHaveBeenCalledWith({
      json: { patternCode: "editorial" },
    });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("422 はサーバーのメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Invalid presentation pattern" }),
    });

    const result = await choosePresentationPattern({ patternCode: "carousel" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Invalid presentation pattern" },
    });
  });

  it("エラーボディが契約外なら fallback メッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await choosePresentationPattern({
      patternCode: "editorial",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "表現パターンの保存に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await choosePresentationPattern({
      patternCode: "editorial",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
