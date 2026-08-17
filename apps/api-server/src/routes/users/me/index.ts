import { Hono } from "hono";
import getMe from "./get";
import updateMyEmail from "./post";

const app = new Hono().route("/", getMe).route("/", updateMyEmail);

export default app;
