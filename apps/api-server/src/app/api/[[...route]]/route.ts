import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import usersCreate from "./users/create";
import usersMe from "./users/me";
import { requireAuthMiddleware } from "../../../middlewares/auth0";

const app = new Hono()
  .basePath("/api")
  .use("*", requireAuthMiddleware)
  .route("/test", test)
  .route("/users/me", usersMe)
  .route("/users", usersCreate);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
