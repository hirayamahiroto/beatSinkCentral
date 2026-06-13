import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.artists.me.profile.$get();

  if (!res.ok) {
    const error = await res.json();
    return c.json(error, res.status);
  }

  return c.json(await res.json());
});

export default app;
