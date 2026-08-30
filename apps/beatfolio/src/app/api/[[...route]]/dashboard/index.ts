import { Hono } from "hono";
import getDashboard from "./getDashboard";
import getSettings from "./getSettings";
import getProfileEditScreen from "./getProfileEditScreen";

const app = new Hono()
  .route("/", getDashboard)
  .route("/settings", getSettings)
  .route("/profile/edit", getProfileEditScreen);

export default app;
