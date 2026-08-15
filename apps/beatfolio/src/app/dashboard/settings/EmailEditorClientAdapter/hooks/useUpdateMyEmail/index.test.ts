import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUpdateMyEmail, type UpdateMyEmailResult } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const postMock = vi.fn();

vi.mock("../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { users: { me: { $post: postMock } } },
  }),
}));

const buildJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const buildNonJsonResponse = (status: number): Response =>
  new Response("<html>error</html>", {
    status,
    headers: { "content-type": "text/html" },
  });

describe("useUpdateMyEmail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("更新に成功すると ok を返し、$post が json で呼ばれ、router.refresh が走る", async () => {
    postMock.mockResolvedValueOnce(buildJsonResponse({}));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "new@example.com" });
    });

    expect(postMock).toHaveBeenCalledWith({
      json: { email: "new@example.com" },
    });
    expect(returned).toStrictEqual({ ok: true });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("4xx はサーバーのエラーメッセージを rejected として返す", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "Email already taken" }, 409),
    );

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "taken@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      kind: "rejected",
      message: "Email already taken",
    });
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("エラー本文が無ければフォールバックメッセージを返す", async () => {
    postMock.mockResolvedValueOnce(buildJsonResponse({}, 400));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      kind: "rejected",
      message: "メールアドレスの更新に失敗しました",
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("入力値に紐づかない 4xx（認証切れ等）は unexpected として返す", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "Unauthorized" }, 401),
    );

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      kind: "unexpected",
      message: "Unauthorized",
    });
  });

  it("5xx は unexpected として返す", async () => {
    postMock.mockResolvedValueOnce(buildNonJsonResponse(500));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      kind: "unexpected",
      message: "メールアドレスの更新に失敗しました",
    });
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("通信自体が失敗した場合も unexpected として返す", async () => {
    postMock.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { result } = renderHook(() => useUpdateMyEmail());

    let returned: UpdateMyEmailResult | undefined;
    await act(async () => {
      returned = await result.current.update({ email: "x@example.com" });
    });

    expect(returned).toStrictEqual({
      ok: false,
      kind: "unexpected",
      message: "通信に失敗しました。時間をおいて再度お試しください",
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("更新中は isLoading が true、完了後に false になる", async () => {
    let resolvePost: ((res: Response) => void) | undefined;
    postMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
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
      resolvePost?.(buildJsonResponse({}));
      await updatePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
