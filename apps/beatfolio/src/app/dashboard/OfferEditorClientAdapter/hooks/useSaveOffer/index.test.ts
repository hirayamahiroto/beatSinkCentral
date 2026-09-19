import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSaveOffer } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

const postMock = vi.fn();

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { offer: { $post: postMock } } } },
  }),
}));

const buildJsonResponse = (body: unknown, init: { status: number }): Response =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });

const input = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [{ name: "Hana", handle: "hana_bb" }],
};

describe("useSaveOffer", () => {
  afterEach(() => vi.clearAllMocks());

  it("オファーを保存し、成功したら画面を更新する", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse({ offer: input }, { status: 200 }),
    );

    const { result } = renderHook(() => useSaveOffer());

    await act(async () => {
      await result.current.save(input);
    });

    expect(postMock).toHaveBeenCalledExactlyOnceWith({ json: input });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("保存に失敗したらサーバーのメッセージを error にセットし、画面は更新しない", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse(
        { error: "Co-performer not found: hana_bb" },
        { status: 422 },
      ),
    );

    const { result } = renderHook(() => useSaveOffer());

    await act(async () => {
      await result.current.save(input);
    });

    expect(result.current.error).toBe("Co-performer not found: hana_bb");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
