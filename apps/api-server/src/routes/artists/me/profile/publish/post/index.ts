import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withWriteCapabilities } from "../../../../../../usecases/authorization";
import { publishMyProfile } from "../../../../../../usecases/artistProfiles/publishMyProfile";
import { validateRequest } from "../../../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";

export const publishProfileRequestSchema = z.object({
  published: z.boolean({ required_error: "published is required" }),
});

export type PublishProfileRequestBody = z.infer<
  typeof publishProfileRequestSchema
>;

const app = new Hono().post(
  "/",
  validateRequest("json", publishProfileRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withWriteCapabilities(
      getCapabilityDeps(),
      auth0User.sub,
      (caps) => publishMyProfile(caps, { published: body.published }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value);
  },
);

export default app;
