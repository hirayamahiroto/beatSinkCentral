import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    const error = await res.json();
    return c.json(error, res.status);
  }

  const data = await res.json();
  return c.json(data);
});

export default app;
