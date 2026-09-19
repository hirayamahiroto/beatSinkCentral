import { Hono } from "hono";
import listPlayers from "./listPlayers";
import getPlayerDetail from "./getPlayerDetail";
import getPlayerConcept from "./getPlayerConcept";

const app = new Hono()
  .route("/", listPlayers)
  .route("/", getPlayerConcept)
  .route("/", getPlayerDetail);

export default app;
