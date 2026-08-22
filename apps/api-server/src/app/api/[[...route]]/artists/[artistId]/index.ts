import { Hono } from "hono";
import updateAccountId from "./updateAccountId";
import getProfile from "./getProfile";
import saveProfile from "./saveProfile";
import publishProfile from "./publishProfile";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", updateAccountId)
  .route("/profile", getProfile)
  .route("/profile", saveProfile)
  .route("/profile/publish", publishProfile);

export default app;
