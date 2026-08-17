import { Hono } from "hono";
import getTest from "./get";
import { requireAuthMiddleware } from "../../../../middlewares/auth0";

const app = new Hono().use("*", requireAuthMiddleware).route("/", getTest);

export default app;
