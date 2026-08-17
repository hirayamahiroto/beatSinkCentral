import { Hono } from "hono";
import createUser from "./post";
import me from "./me";
import { requireAuthMiddleware } from "../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", createUser)
  .route("/me", me);

export default app;
