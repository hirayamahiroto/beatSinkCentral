import { Hono } from "hono";
import listPublicProfiles from "./get";
import getPublicProfile from "./[accountId]/get";
import me from "./me";
import updateAccountId from "./[artistId]/post";
import getProfile from "./[artistId]/profile/get";
import saveProfile from "./[artistId]/profile/post";
import publishProfile from "./[artistId]/profile/publish/post";

// me 系は /artists/:artistId 系への移行が完了するまで併存させる（expand-migrate-contract）
const app = new Hono()
  .route("/", listPublicProfiles)
  .route("/me", me)
  .route("/", updateAccountId)
  .route("/", getProfile)
  .route("/", saveProfile)
  .route("/", publishProfile)
  .route("/", getPublicProfile);

export default app;
