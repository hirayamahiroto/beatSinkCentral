import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { getPublicProfile } from "../../../../../../usecases/artistProfiles/getPublicProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";

const paramSchema = z.object({
  accountId: z.string().min(1).max(255),
});

const app = new Hono().get(
  "/",
  validateRequest("param", paramSchema),
  async (c) => {
    const { accountId } = c.req.valid("param");
    const caps = getCapabilityDeps().buildPublicReadCapabilities();

    const result = await getPublicProfile(caps, { accountId });

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value);
  },
);

export default app;
