import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCreateUser } from "./index";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const postMock = vi.fn();

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { users: { $post: postMock } },
  }),
}));

const buildJsonResponse = (body: unknown, init: { status: number }): Response =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });

const buildNonJsonResponse = (init: { status: number }): Response =>
  new Response("<html></html>", { status: init.status });

describe("useCreateUser", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/users が成功すると /dashboard に遷移し、router.refresh が呼ばれる", async () => {
    postMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 201 }));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(postMock).toHaveBeenCalledWith({
      json: { email: "user@example.com", handle: "newbie" },
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-ok JSON を返したら、error state にメッセージがセットされる", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse(
        { error: "そのハンドルはすでに使用されています" },
        { status: 409 },
      ),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "taken" });
    });

    expect(result.current.error).toBe("そのハンドルはすでに使用されています");
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-JSON ボディを返したら、フォールバックのエラーメッセージがセットされる", async () => {
    postMock.mockResolvedValueOnce(buildNonJsonResponse({ status: 502 }));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).not.toBe("");
    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("通信自体が失敗しても error state にメッセージがセットされる", async () => {
    postMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(result.current.error).toBe(
      "通信に失敗しました。時間をおいて再度お試しください",
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("submit 中は isLoading が true、完了後に false になる", async () => {
    let resolvePost: ((res: Response) => void) | undefined;
    postMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit({ handle: "newbie" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePost?.(buildJsonResponse({}, { status: 201 }));
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
