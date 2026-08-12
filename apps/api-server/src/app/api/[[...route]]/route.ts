import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import usersCreate from "./users/create";
import getMe from "./users/me/get";
import updateMyEmail from "./users/me/post";
import updateMyAccountId from "./artists/me/post";
import getMyProfile from "./artists/me/profile/get";
import saveMyProfile from "./artists/me/profile/post";
import publishMyProfile from "./artists/me/profile/publish/post";
import listPublicProfiles from "./artists/get";
import getPublicProfile from "./artists/detail/get";
import listLinkTypes from "./link-types/get";
import { requireAuthMiddleware } from "../../../middlewares/auth0";
import { requestContextMiddleware } from "../../../middlewares/requestContext";
import { handleAppError } from "../../../errorMap";

const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .use("/test", requireAuthMiddleware)
  .use("/users", requireAuthMiddleware)
  .use("/users/*", requireAuthMiddleware)
  .use("/artists/me", requireAuthMiddleware)
  .use("/artists/me/*", requireAuthMiddleware)
  .route("/test", test)
  .route("/users/me", getMe)
  .route("/users/me", updateMyEmail)
  .route("/users", usersCreate)
  .route("/artists/me/profile", getMyProfile)
  .route("/artists/me/profile", saveMyProfile)
  .route("/artists/me/profile/publish", publishMyProfile)
  .route("/artists/me", updateMyAccountId)
  .route("/artists", listPublicProfiles)
  .route("/artists", getPublicProfile)
  .route("/link-types", listLinkTypes)
  .onError(handleAppError);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
