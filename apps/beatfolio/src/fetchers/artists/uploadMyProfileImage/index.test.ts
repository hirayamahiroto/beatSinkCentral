import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadMyProfileImage } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { imagePostMock } = vi.hoisted(() => ({ imagePostMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { artists: { me: { profile: { image: { $post: imagePostMock } } } } },
  }),
}));

const imageFile = () =>
  new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });

describe("uploadMyProfileImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら imageUrl を含む ok を返す", async () => {
    imagePostMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        imageUrl: "https://example.supabase.co/public/a.jpg",
      }),
    });
    const file = imageFile();

    const result = await uploadMyProfileImage(file);

    expect(imagePostMock).toHaveBeenCalledWith({ form: { file } });
    expect(result).toStrictEqual({
      ok: true,
      value: { imageUrl: "https://example.supabase.co/public/a.jpg" },
    });
  });

  it("413 はエラーメッセージ付きの unexpected を返す", async () => {
    imagePostMock.mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({ error: "Image file is too large" }),
    });

    const result = await uploadMyProfileImage(imageFile());

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "Image file is too large" },
    });
  });

  it("422 は rejected を返す", async () => {
    imagePostMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Unsupported image type" }),
    });

    const result = await uploadMyProfileImage(imageFile());

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "Unsupported image type" },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    imagePostMock.mockRejectedValue(new Error("network down"));

    const result = await uploadMyProfileImage(imageFile());

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
