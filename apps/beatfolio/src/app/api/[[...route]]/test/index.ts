import { Hono } from "hono";
import { z } from "zod";
import { createApiServerClient } from "../../../../utils/client";

const messageSchema = z.object({
  message: z.string(),
});

const app = new Hono().get("/", async (c) => {
  const res = await createApiServerClient().api.test.$get();
  const json = await res.json();

  return c.json({ bffMessage: " bff test", apiMessage: json.message });
});

export default app;
