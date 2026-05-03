import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const buildJsonResponse = (
  body: unknown,
  init: { ok: boolean; status?: number },
): Response =>
  ({
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 400),
    json: async () => body,
  }) as unknown as Response;

const buildNonJsonResponse = (init: {
  ok: boolean;
  status?: number;
}): Response =>
  ({
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  }) as unknown as Response;

describe("useCreateUser", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("POST /api/users が成功すると /dashboard に遷移し、router.refresh が呼ばれる", async () => {
    fetchMock.mockResolvedValueOnce(buildJsonResponse({}, { ok: true }));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ accountId: "newbie" });
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", accountId: "newbie" }),
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-ok JSON を返したら、error state にメッセージがセットされる", async () => {
    fetchMock.mockResolvedValueOnce(
      buildJsonResponse(
        { error: "そのアカウントIDはすでに使用されています" },
        { ok: false, status: 409 },
      ),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ accountId: "taken" });
    });

    expect(result.current.error).toBe(
      "そのアカウントIDはすでに使用されています",
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-JSON ボディを返したら、フォールバックのエラーメッセージがセットされる", async () => {
    fetchMock.mockResolvedValueOnce(
      buildNonJsonResponse({ ok: false, status: 502 }),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ accountId: "newbie" });
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).not.toBe("");
    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("submit 中は isLoading が true、完了後に false になる", async () => {
    let resolveFetch: ((res: Response) => void) | undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit({ accountId: "newbie" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveFetch?.(buildJsonResponse({}, { ok: true }));
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
