import { Hono } from "hono";
import updateMyHandle from "./updateMyHandle";
import saveMyProfile from "./saveMyProfile";
import publishMyProfile from "./publishMyProfile";
import uploadMyProfileImage from "./uploadMyProfileImage";

const app = new Hono()
  .route("/", updateMyHandle)
  .route("/profile", saveMyProfile)
  .route("/profile/publish", publishMyProfile)
  .route("/profile/image", uploadMyProfileImage);

export default app;
