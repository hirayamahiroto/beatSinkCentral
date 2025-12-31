import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import users from "./users";

const app = new Hono()
  .basePath("/api")
  .route("/test", test)
  .route("/users", users);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
