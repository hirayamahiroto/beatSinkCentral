import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUpdateMyEmail, type UpdateMyEmailResult } from "./index";
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
  createEndpointMock<BeatfolioBffClient["api"]["users"]["me"]["$post"]>();

const bffClient = {
  api: { users: { me: { $post: post } } },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

type PostResponse = Awaited<ReturnType<typeof post>>;

const updatedResponse = () =>
  upstreamJsonResponse({ userId: "user-1", email: "new@example.com" });

describe("useUpdateMyEmail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("更新に成功すると ok を返し、$post が json で呼ばれ、router.refresh が走る", async () => {
    post.mockResolvedValueOnce(updatedResponse());

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "new@example.com" });
    });

    expect(post).toHaveBeenCalledWith({ json: { email: "new@example.com" } });
    expect(returned).toStrictEqual({ ok: true, value: undefined });
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("4xx はサーバーのエラーメッセージを rejected として返す", async () => {
    post.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Email already taken" }, 409),
    );

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "taken@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Email already taken" },
    });
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("エラー本文が無ければフォールバックメッセージを返す", async () => {
    post.mockResolvedValueOnce(upstreamErrorResponse({}, 400));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: {
        kind: "rejected",
        message: "メールアドレスの更新に失敗しました",
      },
    });
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("入力値に紐づかない 4xx（認証切れ等）は unexpected として返す", async () => {
    post.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "Unauthorized" }, 401),
    );

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "Unauthorized" },
    });
  });

  it("5xx は unexpected として返す", async () => {
    post.mockResolvedValueOnce(upstreamMalformedJsonResponse(500));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "メールアドレスの更新に失敗しました",
      },
    });
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("通信自体が失敗した場合も unexpected として返す", async () => {
    post.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x" });
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

    const { result } = renderHook(() => useUpdateMyEmail());

    let updatePromise: Promise<UpdateMyEmailResult>;
    act(() => {
      updatePromise = result.current.update({ email: "new@example.com" });
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
