import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useChoosePresentationPattern } from "./index";
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

const presentationPost =
  createEndpointMock<
    BeatfolioBffClient["api"]["artists"]["me"]["presentation"]["$post"]
  >();

const bffClient = {
  api: { artists: { me: { presentation: { $post: presentationPost } } } },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

describe("useChoosePresentationPattern", () => {
  afterEach(() => vi.clearAllMocks());

  it("選んだ patternCode を保存し、成功したら画面を更新する", async () => {
    presentationPost.mockResolvedValueOnce(
      upstreamJsonResponse({ presentation: { patternCode: "editorial" } }),
    );

    const { result } = renderHook(() => useChoosePresentationPattern());

    await act(async () => {
      await result.current.choose("editorial");
    });

    expect(presentationPost).toHaveBeenCalledExactlyOnceWith({
      json: { patternCode: "editorial" },
    });
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("保存に失敗したらサーバーのメッセージを error にセットし、画面は更新しない", async () => {
    presentationPost.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Invalid presentation pattern" }, 422),
    );

    const { result } = renderHook(() => useChoosePresentationPattern());

    await act(async () => {
      await result.current.choose("carousel");
    });

    expect(result.current.error).toBe("Invalid presentation pattern");
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
