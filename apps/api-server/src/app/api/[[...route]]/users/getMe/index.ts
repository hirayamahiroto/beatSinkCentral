import { Hono } from "hono";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { withIdentityCapabilities } from "../../../../../usecases/authorization/identity";
import { getMe } from "../../../../../usecases/users/getMe";
import { handleAppError } from "../../../../../errorMap";

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");

  const result = await withIdentityCapabilities(
    getCapabilityDeps(),
    auth0User.sub,
    (caps) => getMe(caps),
  );

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
