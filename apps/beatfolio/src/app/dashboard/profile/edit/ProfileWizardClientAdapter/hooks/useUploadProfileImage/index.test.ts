import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUploadProfileImage } from "./index";

const imagePostMock = vi.fn();

vi.mock("../../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: {
      artists: {
        ":artistId": {
          profile: {
            image: { $post: imagePostMock },
          },
        },
      },
    },
  }),
}));

const buildJsonResponse = (body: unknown, init: { status: number }): Response =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });

const imageFile = () =>
  new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });

describe("useUploadProfileImage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("artistId を param、ファイルを form で送り、imageUrl を返す", async () => {
    imagePostMock.mockResolvedValueOnce(
      buildJsonResponse(
        { imageUrl: "https://example.supabase.co/public/a.jpg" },
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useUploadProfileImage());
    const file = imageFile();

    const imageUrl = await result.current.uploadImage("artist-1", file);

    expect(imagePostMock).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
      form: { file },
    });
    expect(imageUrl).toBe("https://example.supabase.co/public/a.jpg");
  });

  it("non-ok ならサーバーのエラーメッセージで throw する", async () => {
    imagePostMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "Image file is too large" }, { status: 413 }),
    );

    const { result } = renderHook(() => useUploadProfileImage());

    await expect(
      result.current.uploadImage("artist-1", imageFile()),
    ).rejects.toThrow("Image file is too large");
  });

  it("エラーメッセージが無ければ既定の文言で throw する", async () => {
    imagePostMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 502 }));

    const { result } = renderHook(() => useUploadProfileImage());

    await expect(
      result.current.uploadImage("artist-1", imageFile()),
    ).rejects.toThrow("画像のアップロードに失敗しました");
  });

  it("成功レスポンスに imageUrl が無ければ throw する", async () => {
    imagePostMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));

    const { result } = renderHook(() => useUploadProfileImage());

    await expect(
      result.current.uploadImage("artist-1", imageFile()),
    ).rejects.toThrow("画像のアップロードに失敗しました");
  });
});
