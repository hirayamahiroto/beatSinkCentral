import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../../infrastructure/capabilities";
import { withArtistReadCapabilitiesById } from "../../../../../../../usecases/authorization/artistRead";
import { getMyProfile } from "../../../../../../../usecases/artistProfiles/getMyProfile";
import { validateRequest } from "../../../../validators/validateRequest";
import { handleAppError } from "../../../../../../../errorMap";
import { requireAuthMiddleware } from "../../../../../../../middlewares/auth0";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const app = new Hono().get(
  "/:artistId/profile",
  requireAuthMiddleware,
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

    return c.json(result.value);
  },
);

export default app;
