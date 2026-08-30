import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return c.json({ error: "Failed to fetch settings" }, 502);
  }

  const me = await res.json();

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  return c.json({
    registered: true as const,
    email: me.email,
    accountId: me.artist ? me.artist.accountId : null,
  });
});

export default app;
