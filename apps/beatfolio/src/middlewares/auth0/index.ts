import { createMiddleware } from "hono/factory";
import { handleAuthRequest } from "../../libs/auth0";

export const requireAuthMiddleware = createMiddleware(async (c) => {
  return await handleAuthRequest(c.req.raw);
});
