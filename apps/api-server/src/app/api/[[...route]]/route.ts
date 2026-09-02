import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import users from "./users";
import artists from "./artists";
import linkTypes from "./link-types";
import events from "./events";
import { requestContextMiddleware } from "../../../middlewares/requestContext";
import { handleAppError } from "../../../errorMap";

const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .route("/test", test)
  .route("/users", users)
  .route("/artists", artists)
  .route("/link-types", linkTypes)
  .route("/events", events)
  .onError(handleAppError);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
