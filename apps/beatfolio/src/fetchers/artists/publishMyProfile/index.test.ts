import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishMyProfile } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { profile: { publish: { $post: postMock } } } } },
  }),
}));

describe("publishMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const result = await publishMyProfile({ published: true });

    expect(postMock).toHaveBeenCalledWith({ json: { published: true } });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("404 は unexpected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Profile not found" }),
    });

    const result = await publishMyProfile({ published: true });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "Profile not found",
        missingRequirements: null,
      },
    });
  });

  it("公開条件を満たさない 422 は不足項目付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: "Profile is not publishable: required fields are missing",
        missingRequirements: ["アーティスト写真", "SNS / 配信リンク"],
      }),
    });

    const result = await publishMyProfile({ published: true });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "rejected",
        message: "公開に必要な項目が足りません",
        missingRequirements: ["アーティスト写真", "SNS / 配信リンク"],
      },
    });
  });

  it("エラー本文が読めなければ既定のメッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    const result = await publishMyProfile({ published: true });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "プロフィールの公開に失敗しました",
        missingRequirements: null,
      },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await publishMyProfile({ published: true });

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: NETWORK_ERROR_MESSAGE,
        missingRequirements: null,
      },
    });
  });
});
