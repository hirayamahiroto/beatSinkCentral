import { createMiddleware } from "hono/factory";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "../../libs/auth0";

export const requireSessionMiddleware = createMiddleware(async (c, next) => {
  const req = new NextRequest(c.req.raw);
  const session = await getSessionFromRequest(req);

  if (!session) {
    const loginUrl = new URL("/auth/login", c.req.url);
    return NextResponse.redirect(loginUrl);
  }

  return next();
});
