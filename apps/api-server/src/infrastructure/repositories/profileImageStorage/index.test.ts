import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProfileImageStorage } from "./index";
import type { ProfileImage } from "../../../domain/artistProfiles/valueObjects/profileImage";

const image: ProfileImage = {
  contentType: "image/jpeg",
  sizeBytes: 3,
  extension: "jpg",
};

const createClientStub = ({
  uploadError = null,
}: { uploadError?: Error | null } = {}) => {
  const upload = vi.fn<
    (
      path: string,
      bytes: Uint8Array,
      options: { contentType: string; upsert: boolean },
    ) => Promise<{ data: { path: string } | null; error: Error | null }>
  >(async (path) =>
    uploadError
      ? { data: null, error: uploadError }
      : { data: { path }, error: null },
  );
  const getPublicUrl = vi.fn((path: string) => ({
    data: {
      publicUrl: `http://127.0.0.1:54321/storage/v1/object/public/profile-images/${path}`,
    },
  }));
  const from = vi.fn(() => ({ upload, getPublicUrl }));
  return { client: { storage: { from } }, from, upload, getPublicUrl };
};

describe("createProfileImageStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("profile-images バケットに {artistId}/{uuid}.{ext} 形式のキーで保存する", async () => {
    const stub = createClientStub();
    const storage = createProfileImageStorage(() => stub.client);

    await storage.upload({
      artistId: "artist-1",
      image,
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(stub.from).toHaveBeenCalledWith("profile-images");
    const [path] = stub.upload.mock.calls[0];
    expect(path).toMatch(
      /^artist-1\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    );
  });

  it("contentType を伝播し、upsert しない", async () => {
    const stub = createClientStub();
    const storage = createProfileImageStorage(() => stub.client);
    const bytes = new Uint8Array([1, 2, 3]);

    await storage.upload({ artistId: "artist-1", image, bytes });

    const [, uploadedBytes, options] = stub.upload.mock.calls[0];
    expect(uploadedBytes).toBe(bytes);
    expect(options).toStrictEqual({ contentType: "image/jpeg", upsert: false });
  });

  it("保存したキーの public URL を返す", async () => {
    const stub = createClientStub();
    const storage = createProfileImageStorage(() => stub.client);

    const result = await storage.upload({
      artistId: "artist-1",
      image,
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const [path] = stub.upload.mock.calls[0];
      expect(stub.getPublicUrl).toHaveBeenCalledWith(path);
      expect(result.value.publicUrl).toBe(
        `http://127.0.0.1:54321/storage/v1/object/public/profile-images/${path}`,
      );
    }
  });

  it("upload の失敗は err(ProfileImageUploadFailedError) に翻訳する", async () => {
    const stub = createClientStub({ uploadError: new Error("bucket error") });
    const storage = createProfileImageStorage(() => stub.client);

    const result = await storage.upload({
      artistId: "artist-1",
      image,
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileImageUploadFailedError");
      expect(result.error.reason).toBe("bucket error");
    }
    expect(stub.getPublicUrl).not.toHaveBeenCalled();
  });
});
