import { Hono } from "hono";
import listPlayers from "./listPlayers";
import getPlayerDetail from "./getPlayerDetail";

const app = new Hono().route("/", listPlayers).route("/", getPlayerDetail);

export default app;
