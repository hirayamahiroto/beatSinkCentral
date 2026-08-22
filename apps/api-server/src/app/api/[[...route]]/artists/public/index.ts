import { Hono } from "hono";
import listArtists from "./listArtists";
import getArtist from "./getArtist";

const app = new Hono().route("/", listArtists).route("/:accountId", getArtist);

export default app;
