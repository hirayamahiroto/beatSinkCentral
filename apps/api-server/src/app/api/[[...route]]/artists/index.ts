import { Hono } from "hono";
import listPublicProfiles from "./get";
import getPublicProfile from "./[accountId]/get";
import me from "./me";
import artistId from "./[artistId]";

// me 系は /artists/:artistId 系への移行が完了するまで併存させる（expand-migrate-contract）
const app = new Hono()
  .route("/", listPublicProfiles)
  .route("/me", me)
  .route("/:artistId", artistId)
  .route("/", getPublicProfile);

export default app;
