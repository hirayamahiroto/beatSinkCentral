import { Hono } from "hono";
import { z } from "zod";
import { createBffServerClient } from "../../../../utils/client";

const messageSchema = z.object({
  message: z.string(),
});

const app = new Hono().get("/", async (c) => {
  const res = await createBffServerClient().api.test.$get();
  const json = await res.json();

  return c.json({ bffMessage: " bff test", apiMessage: json.message });
});

export default app;
