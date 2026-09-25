import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePublishProfile } from "./index";
import type { publishMyProfile } from "../../../../../fetchers/artists/publishMyProfile";
import {
  createRouterMock,
  type RouterModule,
} from "../../../../../utils/navigation/testDoubles";

const router = createRouterMock();

vi.mock(
  "next/navigation",
  () => ({ useRouter: () => router }) satisfies RouterModule,
);

const publishMyProfileMock = vi.fn<typeof publishMyProfile>();

vi.mock(
  "../../../../../fetchers/artists/publishMyProfile",
  () =>
    ({
      publishMyProfile: (...args: Parameters<typeof publishMyProfile>) =>
        publishMyProfileMock(...args),
    }) satisfies Pick<
      typeof import("../../../../../fetchers/artists/publishMyProfile"),
      "publishMyProfile"
    >,
);

type PublishResult = Awaited<ReturnType<typeof publishMyProfile>>;

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
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.rejectedRequirements).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("失敗すると error/rejectedRequirements をセットし、router.refresh は呼ばれない", async () => {
    publishMyProfileMock.mockResolvedValueOnce({
      ok: false,
      error: {
        kind: "rejected",
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
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("実行中は isLoading が true、完了後に false になる", async () => {
    let resolvePublish: ((value: PublishResult) => void) | undefined;
    publishMyProfileMock.mockImplementationOnce(
      () =>
        new Promise<PublishResult>((resolve) => {
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
