import { Hono } from "hono";
import getMyProfile from "./get";
import saveMyProfile from "./post";
import publishMyProfile from "./publish/post";
import uploadMyProfileImage from "./image/post";

const app = new Hono()
  .route("/", getMyProfile)
  .route("/", saveMyProfile)
  .route("/publish", publishMyProfile)
  .route("/image", uploadMyProfileImage);

export default app;
