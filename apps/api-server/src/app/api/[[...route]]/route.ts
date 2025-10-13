import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import userCreate from "./user/create";
import usersCreate from "./users/create";

const app = new Hono()
  .basePath("/api")
  .route("/test", test)
  .route("/user", userCreate)
  .route("/users/create", usersCreate);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
