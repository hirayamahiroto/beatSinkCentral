import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import humanBeatboxer from "./humanBeatboxer";

const app = new Hono()
  .basePath("/api")
  .route("/test", test)
  .route("/humanBeatboxer", humanBeatboxer);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
