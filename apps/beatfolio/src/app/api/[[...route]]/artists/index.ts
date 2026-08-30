import { Hono } from "hono";
import me from "./me";

const app = new Hono().route("/me", me);

export default app;
