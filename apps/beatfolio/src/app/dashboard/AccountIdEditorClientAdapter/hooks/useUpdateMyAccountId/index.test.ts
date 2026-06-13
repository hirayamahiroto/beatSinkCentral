import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUpdateMyAccountId } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const postMock = vi.fn();

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { $post: postMock } } },
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

describe("useUpdateMyAccountId", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("更新に成功すると true を返し、$post が json で呼ばれ、router.refresh が走る", async () => {
    postMock.mockResolvedValueOnce(buildJsonResponse({}, { ok: true }));

    const { result } = renderHook(() => useUpdateMyAccountId());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ accountId: "new_id" });
    });

    expect(postMock).toHaveBeenCalledWith({ json: { accountId: "new_id" } });
    expect(returned).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("non-ok JSON が返ったら、サーバーのエラーメッセージを error にセットし false を返す", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse(
        { error: "そのアカウントIDはすでに使用されています" },
        { ok: false, status: 409 },
      ),
    );

    const { result } = renderHook(() => useUpdateMyAccountId());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ accountId: "taken" });
    });

    expect(returned).toBe(false);
    expect(result.current.error).toBe(
      "そのアカウントIDはすでに使用されています",
    );
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("non-ok でエラー本文が無ければ、フォールバックメッセージをセットする", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse({}, { ok: false, status: 400 }),
    );

    const { result } = renderHook(() => useUpdateMyAccountId());

    await act(async () => {
      await result.current.update({ accountId: "x" });
    });

    expect(result.current.error).toBe("Account ID の更新に失敗しました");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("non-JSON ボディが返っても、error が非nullになり refresh は呼ばれない", async () => {
    postMock.mockResolvedValueOnce(buildNonJsonResponse({ ok: false }));

    const { result } = renderHook(() => useUpdateMyAccountId());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ accountId: "x" });
    });

    expect(returned).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error).not.toBe("");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("更新中は isLoading が true、完了後に false になる", async () => {
    let resolvePost: ((res: Response) => void) | undefined;
    postMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() => useUpdateMyAccountId());

    let updatePromise: Promise<boolean>;
    act(() => {
      updatePromise = result.current.update({ accountId: "new_id" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePost?.(buildJsonResponse({}, { ok: true }));
      await updatePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
