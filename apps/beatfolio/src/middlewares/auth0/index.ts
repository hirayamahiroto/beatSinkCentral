import { createMiddleware } from "hono/factory";
import { handleAuthRequest } from "../../libs/auth0";

export type AuthEnv = {
  Variables: {
    authResponse: Response;
  };
};

const isAuthRoute = (url: string): boolean =>
  new URL(url).pathname.startsWith("/auth/");

export const requireAuthMiddleware = createMiddleware<AuthEnv>(
  async (c, next) => {
    const authResponse = await handleAuthRequest(c.req.raw);

    if (isAuthRoute(c.req.url) || authResponse.status !== 200) {
      return authResponse;
    }

    c.set("authResponse", authResponse);
    await next();
  },
);
