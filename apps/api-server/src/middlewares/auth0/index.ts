import { createMiddleware } from "hono/factory";
import { NextRequest } from "next/server";
import { auth0 } from "../../infrastructure/auth0";

export const requireAuthMiddleware = createMiddleware(async (c) => {
  return await auth0.middleware(c.req.raw as NextRequest);
});
