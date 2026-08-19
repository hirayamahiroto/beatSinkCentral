import { Hono } from "hono";
import { createApiServerClient } from "../../../../utils/client";

const app = new Hono().get("/", async (c) => {
  const res = await createApiServerClient().api.test.$get();
  const json = await res.json();

  return c.json({ bffMessage: " bff test", apiMessage: json.message });
});

export default app;
