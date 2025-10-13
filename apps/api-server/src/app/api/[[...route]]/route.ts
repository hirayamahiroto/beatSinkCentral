import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test/index";
import user from "./user/register";
import usersRegister from "./users/register";

const app = new Hono()
  .basePath("/api")
  .route("/test", test)
  .route("/user", user)
  .route("/users/register", usersRegister);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
