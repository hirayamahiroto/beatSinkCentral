import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { throwBffError } from "../../../../../errorMap";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throwBffError(await toUpstreamError(res));

  const me = await readUpstreamJson(res);

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  return c.json({
    registered: true as const,
    email: me.email,
    handle: me.artist ? me.artist.handle : null,
  });
});

export default app;
