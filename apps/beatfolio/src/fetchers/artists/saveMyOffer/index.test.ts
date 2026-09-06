import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyOffer } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { offer: { $post: postMock } } } },
  }),
}));

const input = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "Hana", handle: "hana_bb" },
    { name: "Ken", handle: null },
  ],
};

describe("saveMyOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("オファーを BFF へ送り、成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ offer: input }),
    });

    const result = await saveMyOffer(input);

    expect(postMock).toHaveBeenCalledExactlyOnceWith({ json: input });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("422 はサーバーのメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Co-performer not found: hana_bb" }),
    });

    const result = await saveMyOffer(input);

    expect(result).toStrictEqual({
      ok: false,
      error: {
        kind: "rejected",
        message: "Co-performer not found: hana_bb",
      },
    });
  });

  it("エラーボディが契約外なら fallback メッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await saveMyOffer(input);

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "オファーの保存に失敗しました" },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await saveMyOffer(input);

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
