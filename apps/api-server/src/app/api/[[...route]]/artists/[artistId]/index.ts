import { Hono } from "hono";
import updateHandle from "./updateHandle";
import getProfile from "./getProfile";
import saveProfile from "./saveProfile";
import publishProfile from "./publishProfile";
import uploadProfileImage from "./uploadProfileImage";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", updateHandle)
  .route("/profile", getProfile)
  .route("/profile", saveProfile)
  .route("/profile/publish", publishProfile)
  .route("/profile/image", uploadProfileImage);

export default app;
