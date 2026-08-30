import { Hono } from "hono";
import getOnboarding from "./getOnboarding";

const app = new Hono().route("/", getOnboarding);

export default app;
