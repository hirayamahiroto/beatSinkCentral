import { Hono } from "hono";
import getMyProfile from "./get";
import saveMyProfile from "./post";
import publishMyProfile from "./publish/post";

const app = new Hono()
  .route("/", getMyProfile)
  .route("/", saveMyProfile)
  .route("/publish", publishMyProfile);

export default app;
