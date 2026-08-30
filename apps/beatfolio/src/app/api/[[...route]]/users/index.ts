import { Hono } from "hono";
import createUser from "./createUser";
import me from "./me";

const app = new Hono().route("/", createUser).route("/me", me);

export default app;
