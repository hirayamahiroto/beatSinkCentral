import type { IProfileImageStorage } from "../../../domain/artistProfiles/repositories";
import { createProfileImageUploadFailedError } from "../../../domain/artistProfiles/errors/profileImageUploadFailed";
import { ok, err } from "../../../utils/result";

const PROFILE_IMAGES_BUCKET = "profile-images";

const describeStorageError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type ProfileImageStorageClient = {
  storage: {
    from(bucketId: string): {
      upload(
        path: string,
        bytes: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ data: { path: string } | null; error: unknown }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
};

export const createProfileImageStorage = (
  getClient: () => ProfileImageStorageClient,
): IProfileImageStorage => ({
  async upload({ artistId, image, bytes }) {
    const bucket = getClient().storage.from(PROFILE_IMAGES_BUCKET);
    const path = `${artistId}/${crypto.randomUUID()}.${image.extension}`;

    const uploaded = await bucket.upload(path, bytes, {
      contentType: image.contentType,
      upsert: false,
    });
    if (uploaded.data === null) {
      return err(
        createProfileImageUploadFailedError(
          describeStorageError(uploaded.error),
        ),
      );
    }

    const { data } = bucket.getPublicUrl(uploaded.data.path);
    return ok({ publicUrl: data.publicUrl });
  },
});
