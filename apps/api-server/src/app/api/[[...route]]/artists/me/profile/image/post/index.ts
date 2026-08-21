import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../../../infrastructure/capabilities";
import { withArtistStorageWriteCapabilities } from "../../../../../../../../usecases/authorization/artistStorageWrite";
import { uploadMyProfileImage } from "../../../../../../../../usecases/artistProfiles/uploadMyProfileImage";
import { validateRequest } from "../../../../../validators/validateRequest";
import { handleAppError } from "../../../../../../../../errorMap";

export const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const app = new Hono().post(
  "/",
  validateRequest("form", uploadProfileImageRequestSchema),
  async (c) => {
    const { file } = c.req.valid("form");
    const auth0User = c.get("auth0User");

    const bytes = new Uint8Array(await file.arrayBuffer());

    const result = await withArtistStorageWriteCapabilities(
      getCapabilityDeps(),
      auth0User.sub,
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
