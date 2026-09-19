import { Hono } from "hono";
import listPresentationPatterns from "./listPresentationPatterns";

const app = new Hono().route("/", listPresentationPatterns);

export default app;
