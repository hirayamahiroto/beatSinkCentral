import { createMiddleware } from "hono/factory";
import { NextRequest } from "next/server";
import { auth0 } from "../../libs/auth0";

export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  const session = await auth0.getSession(c.req.raw as NextRequest);
  if (!session) {
    const url = new URL(c.req.url);
    const returnTo = url.pathname + url.search;
    return c.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
        c.req.url
      ).toString()
    );
  }

  return next();
});
