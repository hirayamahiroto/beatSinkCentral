import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistStorageWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistStorageWrite";
import { uploadMyProfileImage } from "../../../../../../usecases/artistProfiles/uploadMyProfileImage";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

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
  validateRequest("param", paramSchema),
  validateRequest("form", uploadProfileImageRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const { file } = c.req.valid("form");
    const auth0User = c.get("auth0User");

    // File は HTTP 層（multipart）由来の型のため、usecase 以下にはプラットフォーム非依存の Uint8Array に変換して渡す
    const bytes = new Uint8Array(await file.arrayBuffer());

    const result = await withArtistStorageWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) =>
        uploadMyProfileImage(caps, {
          contentType: file.type,
          sizeBytes: file.size,
          bytes,
        }),
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
