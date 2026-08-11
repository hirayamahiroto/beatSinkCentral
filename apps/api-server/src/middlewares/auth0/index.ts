import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getSessionProvider } from "../../infrastructure/auth0";
import type { SessionProvider } from "../../infrastructure/auth0/sessionProvider";
import { createUnauthorizedError } from "./errors/unauthorized";

export type AuthenticatedUser = {
  sub: string;
};

declare module "hono" {
  interface ContextVariableMap {
    auth0User: AuthenticatedUser;
  }
}

export const createRequireAuthMiddleware = (
  resolveSessionProvider: () => SessionProvider,
) =>
  createMiddleware(async (c, next) => {
    const session = await resolveSessionProvider().getSession(getCookie(c));
    if (!session) {
      throw createUnauthorizedError();
    }

    c.set("auth0User", { sub: session.sub });

    await next();
  });

export const requireAuthMiddleware =
  createRequireAuthMiddleware(getSessionProvider);
