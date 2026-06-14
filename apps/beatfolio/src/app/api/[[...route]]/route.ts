import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../middlewares/requestContext";
import test from "./test";
import usersCreate from "./users/create";
import usersMe from "./users/me";
import artistsMe from "./artists/me";
import getMyProfile from "./artists/me/profile/get";
import saveMyProfile from "./artists/me/profile/post";
import publishMyProfile from "./artists/me/profile/publish/post";

export type Env = RequestContextEnv;

const app = new Hono<Env>()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .route("/test", test)
  .route("/users/me", usersMe)
  .route("/users", usersCreate)
  .route("/artists/me/profile", getMyProfile)
  .route("/artists/me/profile", saveMyProfile)
  .route("/artists/me/profile/publish", publishMyProfile)
  .route("/artists/me", artistsMe);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
