import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUpdateMyHandle, type UpdateMyHandleResult } from "./index";
import {
  createRouterMock,
  type RouterModule,
} from "../../../../../../utils/navigation/testDoubles";
import {
  createEndpointMock,
  upstreamJsonResponse,
  upstreamErrorResponse,
  upstreamMalformedJsonResponse,
  type BeatfolioBffClient,
  type BeatfolioBffClientMock,
} from "../../../../../../utils/client/testDoubles";

const router = createRouterMock();

vi.mock(
  "next/navigation",
  () => ({ useRouter: () => router }) satisfies RouterModule,
);

const post =
  createEndpointMock<BeatfolioBffClient["api"]["artists"]["me"]["$post"]>();

const bffClient = {
  api: { artists: { me: { $post: post } } },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

type PostResponse = Awaited<ReturnType<typeof post>>;

const updatedResponse = () =>
  upstreamJsonResponse({ artistId: "artist-1", handle: "new_id" });

describe("useUpdateMyHandle", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("更新に成功すると ok を返し、$post が json で呼ばれ、router.refresh が走る", async () => {
    post.mockResolvedValueOnce(updatedResponse());

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "new_id" });
    });

    expect(post).toHaveBeenCalledWith({ json: { handle: "new_id" } });
    expect(returned).toStrictEqual({ ok: true, value: undefined });
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("4xx はサーバーのエラーメッセージを rejected として返す", async () => {
    post.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Handle already taken: taken" }, 409),
    );

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "taken" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Handle already taken: taken" },
    });
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("エラー本文が無ければフォールバックメッセージを返す", async () => {
    post.mockResolvedValueOnce(upstreamErrorResponse({}, 400));

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Handle の更新に失敗しました" },
    });
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("入力値に紐づかない 4xx（認証切れ等）は unexpected として返す", async () => {
    post.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Unauthorized" }, 401),
    );

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "Unauthorized" },
    });
  });

  it("5xx は unexpected として返す", async () => {
    post.mockResolvedValueOnce(upstreamMalformedJsonResponse(500));

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "Handle の更新に失敗しました" },
    });
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("通信自体が失敗した場合も unexpected として返す", async () => {
    post.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { result } = renderHook(() => useUpdateMyHandle());

    let returned: UpdateMyHandleResult | undefined;
    await act(async () => {
      returned = await result.current.update({ handle: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      },
    });
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("更新中は isLoading が true、完了後に false になる", async () => {
    let resolvePost: ((res: PostResponse) => void) | undefined;
    post.mockImplementationOnce(
      () =>
        new Promise<PostResponse>((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() => useUpdateMyHandle());

    let updatePromise: Promise<UpdateMyHandleResult>;
    act(() => {
      updatePromise = result.current.update({ handle: "new_id" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePost?.(updatedResponse());
      await updatePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
