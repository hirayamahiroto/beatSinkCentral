import { Hono } from "hono";
import listPublicProfiles from "./get";
import getPublicProfile from "./[accountId]/get";
import me from "./me";

const app = new Hono()
  .route("/", listPublicProfiles)
  .route("/me", me)
  .route("/", getPublicProfile);

export default app;
