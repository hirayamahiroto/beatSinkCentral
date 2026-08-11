import { Hono } from "hono";
import { getCapabilityDeps } from "../../../../infrastructure/capabilities";
import { getPublicProfile } from "../../../../usecases/artistProfiles/getPublicProfile";
import { handleAppError } from "../../../../errorMap";

const app = new Hono().get("/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const caps = getCapabilityDeps().buildPublicReadCapabilities();

  const result = await getPublicProfile(caps, { accountId });

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
