import { createMiddleware } from "hono/factory";
import { auth0 } from "../../libs/auth0";

export const requireAuthMiddleware = createMiddleware(async (c) => {
  return await auth0.middleware(c.req.raw);
});
