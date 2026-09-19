import { Hono } from "hono";
import recordEvent from "./recordEvent";

const app = new Hono().route("/", recordEvent);

export default app;
