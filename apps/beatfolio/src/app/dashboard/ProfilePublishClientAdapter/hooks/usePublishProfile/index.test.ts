import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePublishProfile } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const publishMyProfileMock = vi.fn();

vi.mock("../../../../../fetchers/artists/publishMyProfile", () => ({
  publishMyProfile: (...args: unknown[]) => publishMyProfileMock(...args),
}));

describe("usePublishProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("成功すると published を送信し、router.refresh が走り、error/rejectedRequirements が null になる", async () => {
    publishMyProfileMock.mockResolvedValueOnce({ ok: true, value: undefined });

    const { result } = renderHook(() => usePublishProfile());

    await act(async () => {
      await result.current.setPublished(true);
    });

    expect(publishMyProfileMock).toHaveBeenCalledWith({ published: true });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.rejectedRequirements).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("失敗すると error/rejectedRequirements をセットし、router.refresh は呼ばれない", async () => {
    publishMyProfileMock.mockResolvedValueOnce({
      ok: false,
      error: {
        message: "公開に必要な項目が足りません",
        missingRequirements: ["tagline"],
      },
    });

    const { result } = renderHook(() => usePublishProfile());

    await act(async () => {
      await result.current.setPublished(true);
    });

    expect(result.current.error).toBe("公開に必要な項目が足りません");
    expect(result.current.rejectedRequirements).toStrictEqual(["tagline"]);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("実行中は isLoading が true、完了後に false になる", async () => {
    let resolvePublish:
      | ((value: { ok: true; value: undefined }) => void)
      | undefined;
    publishMyProfileMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePublish = resolve;
        }),
    );

    const { result } = renderHook(() => usePublishProfile());

    let publishPromise: Promise<void>;
    act(() => {
      publishPromise = result.current.setPublished(true);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePublish?.({ ok: true, value: undefined });
      await publishPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
