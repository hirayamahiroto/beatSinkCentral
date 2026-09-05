import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistStorageWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistStorageWrite";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { uploadMyProfileImage } from "../../../../../../usecases/artistProfiles/uploadMyProfileImage";
import { changeMyProfileImage } from "../../../../../../usecases/artistProfiles/changeMyProfileImage";
import { PROFILE_IMAGE_MAX_SIZE_BYTES } from "../../../../../../domain/artistProfiles/valueObjects/profileImage";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createRequestBodyTooLargeError } from "../../../errors/requestBodyTooLarge";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const MULTIPART_FRAMING_ALLOWANCE_BYTES = 1024;

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

export const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const uploadProfileImageResponseSchema = z.object({
  imageUrl: z.string(),
});

const app = new Hono().post(
  "/",
  bodyLimit({
    maxSize: PROFILE_IMAGE_MAX_SIZE_BYTES + MULTIPART_FRAMING_ALLOWANCE_BYTES,
    onError: () => {
      throw createRequestBodyTooLargeError();
    },
  }),
  validateRequest("param", paramSchema),
  validateRequest("form", uploadProfileImageRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const { file } = c.req.valid("form");
    const auth0User = c.get("auth0User");
    const deps = getCapabilityDeps();

    const uploaded = await withArtistStorageWriteCapabilitiesById(
      deps,
      auth0User.sub,
      artistId,
      async (caps) =>
        uploadMyProfileImage(caps, {
          contentType: file.type,
          sizeBytes: file.size,
          // File は HTTP 層（multipart）由来の型のため、usecase 以下にはプラットフォーム非依存の Uint8Array に変換して渡す
          bytes: new Uint8Array(await file.arrayBuffer()),
        }),
    );

    if (!uploaded.ok) {
      return handleAppError(uploaded.error, c);
    }

    const result = await withArtistWriteCapabilitiesById(
      deps,
      auth0User.sub,
      artistId,
      (caps) =>
        changeMyProfileImage(caps, { imageUrl: uploaded.value.imageUrl }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = uploadProfileImageResponseSchema.safeParse(result.value);
    if (!response.success) {
      return handleAppError(
        createResponseContractViolationError(response.error.issues),
        c,
      );
    }

    return c.json(response.data);
  },
);

export default app;
