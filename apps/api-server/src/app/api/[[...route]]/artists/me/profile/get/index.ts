import { Hono } from "hono";
import { getCapabilityDeps } from "../../../../../../../infrastructure/capabilities";
import { withReadCapabilities } from "../../../../../../../usecases/authorization";
import { getMyProfile } from "../../../../../../../usecases/artistProfiles/getMyProfile";
import { handleAppError } from "../../../../../../../errorMap";

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");

  const result = await withReadCapabilities(
    getCapabilityDeps(),
    auth0User.sub,
    (caps) => getMyProfile(caps),
  );

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
