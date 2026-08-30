import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  try {
    const res = await apiClient.api.artists.$get();

    if (!res.ok) {
      return c.json({ error: "Failed to fetch players" }, 502);
    }

    const { profiles } = await res.json();

    return c.json({ players: profiles });
  } catch {
    return c.json({ error: "Failed to fetch players" }, 502);
  }
});

export default app;
