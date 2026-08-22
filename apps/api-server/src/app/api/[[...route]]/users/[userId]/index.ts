import { Hono } from "hono";
import updateEmail from "./updateEmail";

const app = new Hono().route("/", updateEmail);

export default app;
