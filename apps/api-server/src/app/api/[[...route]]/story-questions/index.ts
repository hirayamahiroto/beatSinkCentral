import { Hono } from "hono";
import listStoryQuestions from "./listStoryQuestions";

const app = new Hono().route("/", listStoryQuestions);

export default app;
