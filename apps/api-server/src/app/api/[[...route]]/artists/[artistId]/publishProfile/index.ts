import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { publishMyProfile } from "../../../../../../usecases/artistProfiles/publishMyProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

export const publishProfileRequestSchema = z.object({
  published: z.boolean({ required_error: "published is required" }),
});

export type PublishProfileRequestBody = z.infer<
  typeof publishProfileRequestSchema
>;

const publishProfileResponseSchema = z.object({
  published: z.boolean(),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", publishProfileRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => publishMyProfile(caps, { published: body.published }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = publishProfileResponseSchema.safeParse(result.value);
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
