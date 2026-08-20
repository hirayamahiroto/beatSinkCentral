import { describe, it, expect } from "vitest";
import { createProfileImage, PROFILE_IMAGE_MAX_SIZE_BYTES } from "./index";

describe("createProfileImage", () => {
  it("サポートされた contentType とサイズで生成する", () => {
    const result = createProfileImage({
      contentType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.contentType).toBe("image/jpeg");
      expect(result.value.sizeBytes).toBe(1024);
      expect(result.value.extension).toBe("jpg");
    }
  });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("%s から拡張子 %s を導出する", (contentType, extension) => {
    const result = createProfileImage({ contentType, sizeBytes: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.extension).toBe(extension);
    }
  });

  it("サポート外の contentType は err(UnsupportedImageTypeError)", () => {
    const result = createProfileImage({
      contentType: "image/gif",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UnsupportedImageTypeError");
    }
  });

  it("上限ちょうどのサイズは ok", () => {
    const result = createProfileImage({
      contentType: "image/png",
      sizeBytes: PROFILE_IMAGE_MAX_SIZE_BYTES,
    });

    expect(result.ok).toBe(true);
  });

  it("上限を超えるサイズは err(ImageTooLargeError)", () => {
    const result = createProfileImage({
      contentType: "image/png",
      sizeBytes: PROFILE_IMAGE_MAX_SIZE_BYTES + 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ImageTooLargeError");
    }
  });

  it("サイズ 0 は err(EmptyImageFileError)", () => {
    const result = createProfileImage({
      contentType: "image/png",
      sizeBytes: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("EmptyImageFileError");
    }
  });
});
