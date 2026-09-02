import { Hono } from "hono";
import trackEvent from "./trackEvent";

const app = new Hono().route("/", trackEvent);

export default app;
