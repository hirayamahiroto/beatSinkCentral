import { Hono } from "hono";
import updateMyAccountId from "./updateMyAccountId";
import saveMyProfile from "./saveMyProfile";
import publishMyProfile from "./publishMyProfile";
import uploadMyProfileImage from "./uploadMyProfileImage";

const app = new Hono()
  .route("/", updateMyAccountId)
  .route("/profile", saveMyProfile)
  .route("/profile/publish", publishMyProfile)
  .route("/profile/image", uploadMyProfileImage);

export default app;
