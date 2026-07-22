import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../middlewares/requestContext";
import test from "./test";
import getPlayerDetail from "./players/detail/get";
import getOnboarding from "./onboarding/get";
import getDashboard from "./dashboard/get";
import getDashboardSettings from "./dashboard/settings/get";
import getProfileEdit from "./dashboard/profile/edit/get";
import usersCreate from "./users/create";
import updateMyEmail from "./users/me/post";
import updateMyAccountId from "./artists/me/post";
import saveMyProfile from "./artists/me/profile/post";
import publishMyProfile from "./artists/me/profile/publish/post";

export type Env = RequestContextEnv;

const app = new Hono<Env>()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .route("/test", test)
  .route("/players", getPlayerDetail)
  .route("/onboarding", getOnboarding)
  .route("/dashboard", getDashboard)
  .route("/dashboard/settings", getDashboardSettings)
  .route("/dashboard/profile/edit", getProfileEdit)
  .route("/users", usersCreate)
  .route("/users/me", updateMyEmail)
  .route("/artists/me", updateMyAccountId)
  .route("/artists/me/profile", saveMyProfile)
  .route("/artists/me/profile/publish", publishMyProfile);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
