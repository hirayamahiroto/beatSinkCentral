import { Hono } from "hono";
import publicRoutes from "./public";
import artistId from "./[artistId]";

const app = new Hono().route("/", publicRoutes).route("/:artistId", artistId);

export default app;
