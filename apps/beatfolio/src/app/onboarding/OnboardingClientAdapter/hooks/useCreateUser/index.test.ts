import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCreateUser } from "./index";
import {
  createRouterMock,
  type RouterModule,
} from "../../../../../utils/navigation/testDoubles";
import {
  createEndpointMock,
  upstreamJsonResponse,
  upstreamErrorResponse,
  upstreamMalformedJsonResponse,
  type BeatfolioBffClient,
  type BeatfolioBffClientMock,
} from "../../../../../utils/client/testDoubles";

const router = createRouterMock();

vi.mock(
  "next/navigation",
  () => ({ useRouter: () => router }) satisfies RouterModule,
);

const usersPost =
  createEndpointMock<BeatfolioBffClient["api"]["users"]["$post"]>();

const bffClient = {
  api: { users: { $post: usersPost } },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

type UsersPostResponse = Awaited<ReturnType<typeof usersPost>>;

const createdResponse = () =>
  upstreamJsonResponse({ userId: "user-1", artistId: "artist-1" }, 201);

describe("useCreateUser", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/users が成功すると /dashboard に遷移し、router.refresh が呼ばれる", async () => {
    usersPost.mockResolvedValueOnce(createdResponse());

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(usersPost).toHaveBeenCalledWith({
      json: { email: "user@example.com", handle: "newbie" },
    });
    expect(router.push).toHaveBeenCalledWith("/dashboard");
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-ok JSON を返したら、error state にメッセージがセットされる", async () => {
    usersPost.mockResolvedValueOnce(
      upstreamErrorResponse(
        { error: "そのハンドルはすでに使用されています" },
        409,
      ),
    );

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "taken" });
    });

    expect(result.current.error).toBe("そのハンドルはすでに使用されています");
    expect(router.push).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("POST が non-JSON ボディを返したら、フォールバックのエラーメッセージがセットされる", async () => {
    usersPost.mockResolvedValueOnce(upstreamMalformedJsonResponse(502));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(result.current.error).toBe("ユーザー作成に失敗しました");
    expect(router.push).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("通信自体が失敗しても error state にメッセージがセットされる", async () => {
    usersPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() =>
      useCreateUser({ email: "user@example.com" }),
    );

    await act(async () => {
      await result.current.handleSubmit({ handle: "newbie" });
    });

    expect(result.current.error).toBe(
      "通信に失敗しました。時間をおいて再度お試しください",
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("submit 中は isLoading が true、完了後に false になる", async () => {
    let resolvePost: ((res: UsersPostResponse) => void) | undefined;
    usersPost.mockImplementationOnce(
      () =>
        new Promise<UsersPostResponse>((resolve) => {
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
      resolvePost?.(createdResponse());
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
