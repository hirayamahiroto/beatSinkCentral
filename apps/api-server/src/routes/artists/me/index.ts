import { Hono } from "hono";
import updateMyAccountId from "./post";
import profile from "./profile";
import { requireAuthMiddleware } from "../../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", updateMyAccountId)
  .route("/profile", profile);

export default app;
