import { createMiddleware } from "hono/factory";
import { NextRequest } from "next/server";
import { auth0 } from "../../libs/auth0";

export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  return await auth0.middleware(c.req.raw as NextRequest);
});
