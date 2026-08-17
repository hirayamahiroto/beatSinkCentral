import { Hono } from "hono";

const app = new Hono().get("/", async (c) => {
  return c.json({ message: "Hello World" });
});

export default app;
