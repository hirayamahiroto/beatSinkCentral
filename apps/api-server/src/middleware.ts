import { Hono } from "hono";
import { except } from "hono/combine";
import { handle } from "hono/vercel";
import { basicAuthMiddleware } from "./middlewares/basicAuth";
import { requireAuthMiddleware } from "./middlewares/auth0";

const app = new Hono();

app.use("*", except("/auth/*", basicAuthMiddleware));
app.use("*", requireAuthMiddleware);

export const middleware = handle(app);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
