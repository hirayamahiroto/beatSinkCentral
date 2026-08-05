import { createMiddleware } from "hono/factory";
import { auth0 } from "../../infrastructure/auth0";
import { createUnauthorizedError } from "./errors/unauthorized";

export type AuthenticatedUser = {
  sub: string;
};

declare module "hono" {
  interface ContextVariableMap {
    auth0User: AuthenticatedUser;
  }
}

export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw createUnauthorizedError();
  }

  c.set("auth0User", { sub: session.user.sub });

  await next();
});
