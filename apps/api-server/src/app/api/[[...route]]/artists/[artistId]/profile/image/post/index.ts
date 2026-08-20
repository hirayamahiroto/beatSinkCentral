import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../../../infrastructure/capabilities";
import { withArtistStorageWriteCapabilitiesById } from "../../../../../../../../usecases/authorization/artistStorageWrite";
import { uploadMyProfileImage } from "../../../../../../../../usecases/artistProfiles/uploadMyProfileImage";
import { validateRequest } from "../../../../../validators/validateRequest";
import { handleAppError } from "../../../../../../../../errorMap";
import { requireAuthMiddleware } from "../../../../../../../../middlewares/auth0";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

export const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const app = new Hono().post(
  "/:artistId/profile/image",
  requireAuthMiddleware,
  validateRequest("param", paramSchema),
  validateRequest("form", uploadProfileImageRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const { file } = c.req.valid("form");
    const auth0User = c.get("auth0User");

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

    return c.json(result.value);
  },
);

export default app;
