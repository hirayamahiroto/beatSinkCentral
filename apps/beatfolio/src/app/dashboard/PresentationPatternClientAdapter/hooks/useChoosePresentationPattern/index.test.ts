import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useChoosePresentationPattern } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

const postMock = vi.fn();

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { presentation: { $post: postMock } } } },
  }),
}));

const buildJsonResponse = (body: unknown, init: { status: number }): Response =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });

describe("useChoosePresentationPattern", () => {
  afterEach(() => vi.clearAllMocks());

  it("選んだ patternCode を保存し、成功したら画面を更新する", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse(
        { presentation: { patternCode: "editorial" } },
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useChoosePresentationPattern());

    await act(async () => {
      await result.current.choose("editorial");
    });

    expect(postMock).toHaveBeenCalledExactlyOnceWith({
      json: { patternCode: "editorial" },
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("保存に失敗したらサーバーのメッセージを error にセットし、画面は更新しない", async () => {
    postMock.mockResolvedValueOnce(
      buildJsonResponse(
        { error: "Invalid presentation pattern" },
        { status: 422 },
      ),
    );

    const { result } = renderHook(() => useChoosePresentationPattern());

    await act(async () => {
      await result.current.choose("carousel");
    });

    expect(result.current.error).toBe("Invalid presentation pattern");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
