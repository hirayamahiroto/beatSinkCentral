import { Hono } from "hono";
import createUser from "./createUser";
import getMe from "./getMe";
import userId from "./[userId]";
import { requireAuthMiddleware } from "../../../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", createUser)
  .route("/me", getMe)
  .route("/:userId", userId);

export default app;
