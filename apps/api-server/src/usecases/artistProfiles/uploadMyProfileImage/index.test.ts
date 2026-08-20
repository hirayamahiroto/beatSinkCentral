import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadMyProfileImage } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { createProfileImageUploadFailedError } from "../../../domain/artistProfiles/errors/profileImageUploadFailed";
import type { IProfileImageStorage } from "../../../domain/artistProfiles/repositories";
import type { Actor, ArtistStorageWriteCapabilities } from "../../capabilities";
import { ok, err } from "../../../utils/result";

const existingUser = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "beatboxer_taro",
  ownerUserId: existingUser.getId(),
  profile: null,
});

const actor: Actor = { user: existingUser, artist: existingArtist };

const createCaps = () =>
  ({
    actor,
    profileImages: {
      upload: vi.fn<IProfileImageStorage["upload"]>(async () =>
        ok({ publicUrl: "https://example.supabase.co/public/a.jpg" }),
      ),
    },
  }) satisfies ArtistStorageWriteCapabilities;

describe("uploadMyProfileImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("画像をアップロードし public URL を返す", async () => {
    const caps = createCaps();
    const bytes = new Uint8Array([1, 2, 3]);

    const result = await uploadMyProfileImage(caps, {
      contentType: "image/jpeg",
      sizeBytes: 3,
      bytes,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe(
        "https://example.supabase.co/public/a.jpg",
      );
    }
  });

  it("actor の artistId と検証済み画像でストレージに渡す", async () => {
    const caps = createCaps();
    const bytes = new Uint8Array([1, 2, 3]);

    await uploadMyProfileImage(caps, {
      contentType: "image/png",
      sizeBytes: 3,
      bytes,
    });

    expect(caps.profileImages.upload).toHaveBeenCalledWith({
      artistId: "artist-1",
      image: { contentType: "image/png", sizeBytes: 3, extension: "png" },
      bytes,
    });
  });

  it("サポート外の contentType は err（アップロードしない）", async () => {
    const caps = createCaps();

    const result = await uploadMyProfileImage(caps, {
      contentType: "image/gif",
      sizeBytes: 3,
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UnsupportedImageTypeError");
    }
    expect(caps.profileImages.upload).not.toHaveBeenCalled();
  });

  it("ストレージの失敗は err(ProfileImageUploadFailedError) を伝播する", async () => {
    const caps = createCaps();
    caps.profileImages.upload.mockResolvedValue(
      err(createProfileImageUploadFailedError()),
    );

    const result = await uploadMyProfileImage(caps, {
      contentType: "image/jpeg",
      sizeBytes: 3,
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileImageUploadFailedError");
    }
  });
});
