import { Hono } from "hono";
import { z } from "zod";

const testResponseSchema = z.object({ message: z.string() });

const app = new Hono().get("/", async (c) => {
  return c.json(testResponseSchema.parse({ message: "Hello World" }));
});

export default app;
