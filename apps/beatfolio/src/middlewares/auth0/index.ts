import { createMiddleware } from "hono/factory";
import type { NextRequest } from "next/server";
import { auth0 } from "../../libs/auth0";

export const auth0Middleware = createMiddleware(async (c) => {
  const request = c.req.raw as NextRequest;

  const response = await auth0.middleware(request);

  return response;
});

export const auth0RouteMiddleware = auth0Middleware;
