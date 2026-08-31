import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistReadCapabilitiesById } from "../../../../../../usecases/authorization/artistRead";
import { getMyProfile } from "../../../../../../usecases/artistProfiles/getMyProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const profileLinkSchema = z.object({
  type: z.string(),
  url: z.string(),
  label: z.string().nullable(),
});

const artistProfileViewSchema = z.object({
  name: z.string().nullable(),
  tagline: z.string().nullable(),
  imageUrl: z.string().nullable(),
  story: z.string().nullable(),
  activityInfo: z.string().nullable(),
  genres: z.array(z.string()),
  links: z.array(profileLinkSchema),
  published: z.boolean(),
});

const publishRequiredFieldSchema = z.enum([
  "name",
  "imageUrl",
  "story",
  "genres",
  "links",
]);

const getProfileResponseSchema = z.object({
  handle: z.string(),
  profile: artistProfileViewSchema.nullable(),
  missingPublishFields: z.array(publishRequiredFieldSchema).nullable(),
});

const app = new Hono().get(
  "/",
  validateRequest("param", paramSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const auth0User = c.get("auth0User");

    const result = await withArtistReadCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => getMyProfile(caps),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = getProfileResponseSchema.safeParse(result.value);
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
