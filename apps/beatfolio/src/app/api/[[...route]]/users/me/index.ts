import { Hono } from "hono";
import updateMyEmail from "./updateMyEmail";

const app = new Hono().route("/", updateMyEmail);

export default app;
