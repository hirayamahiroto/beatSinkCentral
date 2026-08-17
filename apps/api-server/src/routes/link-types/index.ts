import { Hono } from "hono";
import listLinkTypes from "./get";

const app = new Hono().route("/", listLinkTypes);

export default app;
