import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../middlewares/requestContext";
import test from "./test";
import usersCreate from "./users/create";

export type Env = RequestContextEnv;

const app = new Hono<Env>()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .route("/test", test)
  .route("/users", usersCreate);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
