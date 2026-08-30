import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return c.json({ error: "Failed to fetch onboarding" }, 502);
  }

  const me = await res.json();

  return c.json({ registered: me.registered });
});

export default app;
