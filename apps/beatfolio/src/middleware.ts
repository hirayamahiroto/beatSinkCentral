import { Hono } from "hono";
import { except } from "hono/combine";
import { handle } from "hono/vercel";
import { basicAuthMiddleware } from "./middlewares/basicAuth";
import { requireAuthMiddleware, type AuthEnv } from "./middlewares/auth0";
import { requireSessionMiddleware } from "./middlewares/requireSession";

export const SESSION_REQUIRED_PATHS = [
  "/onboarding/*",
  "/dashboard/*",
] as const;

const app = new Hono<AuthEnv>()
  .use("*", except(["/auth/*", "/api/*"], basicAuthMiddleware))
  .use("*", requireAuthMiddleware);

for (const path of SESSION_REQUIRED_PATHS) {
  app.use(path, requireSessionMiddleware);
}

app.all("*", (c) => c.get("authResponse"));

export const middleware = handle(app);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
