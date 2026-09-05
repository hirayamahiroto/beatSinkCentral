import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyProfile, type SaveMyProfileInput } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { profile: { $post: postMock } } } },
  }),
}));

const input: SaveMyProfileInput = {
  name: "SAKU",
  genres: ["Beatbox"],
  chapters: [{ questionCode: "beginning", body: "始めたきっかけ。" }],
  links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
};

describe("saveMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const result = await saveMyProfile(input);

    expect(postMock).toHaveBeenCalledWith({ json: input });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("422 はエラーメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Invalid name format" }),
    });

    const result = await saveMyProfile({ ...input, name: "a".repeat(256) });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Invalid name format" },
    });
  });

  it("エラーボディが契約外なら fallback メッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await saveMyProfile(input);

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

    const result = await saveMyProfile(input);

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
