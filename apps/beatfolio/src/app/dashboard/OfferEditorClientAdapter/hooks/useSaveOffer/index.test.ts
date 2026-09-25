import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSaveOffer } from "./index";
import {
  createRouterMock,
  type RouterModule,
} from "../../../../../utils/navigation/testDoubles";
import {
  createEndpointMock,
  upstreamJsonResponse,
  upstreamErrorResponse,
  type BeatfolioBffClient,
  type BeatfolioBffClientMock,
} from "../../../../../utils/client/testDoubles";

const router = createRouterMock();

vi.mock(
  "next/navigation",
  () => ({ useRouter: () => router }) satisfies RouterModule,
);

const offerPost =
  createEndpointMock<
    BeatfolioBffClient["api"]["artists"]["me"]["offer"]["$post"]
  >();

const bffClient = {
  api: { artists: { me: { offer: { $post: offerPost } } } },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

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
    offerPost.mockResolvedValueOnce(upstreamJsonResponse({ offer: input }));

    const { result } = renderHook(() => useSaveOffer());

    await act(async () => {
      await result.current.save(input);
    });

    expect(offerPost).toHaveBeenCalledExactlyOnceWith({ json: input });
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("保存に失敗したらサーバーのメッセージを error にセットし、画面は更新しない", async () => {
    offerPost.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Co-performer not found: hana_bb" }, 422),
    );

    const { result } = renderHook(() => useSaveOffer());

    await act(async () => {
      await result.current.save(input);
    });

    expect(result.current.error).toBe("Co-performer not found: hana_bb");
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
