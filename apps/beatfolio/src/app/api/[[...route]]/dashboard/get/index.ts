import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return c.json({ error: "Failed to fetch dashboard" }, 502);
  }

  const me = await res.json();

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  return c.json({
    registered: true as const,
    artist: me.artist
      ? { accountId: me.artist.accountId, hasProfile: me.artist.hasProfile }
      : null,
  });
});

export default app;
