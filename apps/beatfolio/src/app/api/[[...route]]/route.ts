import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../middlewares/requestContext";
import test from "./test";
import players from "./players";
import onboarding from "./onboarding";
import dashboard from "./dashboard";
import users from "./users";
import artists from "./artists";
import events from "./events";
import { handleBffError } from "../../../errorMap";

export type Env = RequestContextEnv;

const app = new Hono<Env>()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .route("/test", test)
  .route("/players", players)
  .route("/onboarding", onboarding)
  .route("/dashboard", dashboard)
  .route("/users", users)
  .route("/artists", artists)
  .route("/events", events)
  .onError(handleBffError);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
