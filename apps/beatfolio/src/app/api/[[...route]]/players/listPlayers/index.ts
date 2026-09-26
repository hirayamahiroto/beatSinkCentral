import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { throwBffError } from "../../../../../errorMap";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.artists.$get();
  if (!res.ok) throwBffError(await toUpstreamError(res));

  const { profiles } = await readUpstreamJson(res);

  return c.json({ players: profiles });
});

export default app;
