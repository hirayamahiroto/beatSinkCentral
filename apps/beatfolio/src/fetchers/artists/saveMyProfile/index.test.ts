import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyProfile } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { profile: { $post: postMock } } } },
  }),
}));

describe("saveMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const result = await saveMyProfile({ name: "SAKU", genres: ["Beatbox"] });

    expect(postMock).toHaveBeenCalledWith({
      json: { name: "SAKU", genres: ["Beatbox"] },
    });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("422 はエラーメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Invalid imageUrl format" }),
    });

    const result = await saveMyProfile({ imageUrl: "not-a-url" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Invalid imageUrl format" },
    });
  });

  it("エラーボディが契約外なら fallback メッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await saveMyProfile({ name: "SAKU" });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "プロフィールの保存に失敗しました",
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await saveMyProfile({ name: "SAKU" });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
