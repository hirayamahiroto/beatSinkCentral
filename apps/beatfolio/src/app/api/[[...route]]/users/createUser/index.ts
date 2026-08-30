import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { validateRequest } from "../../validators/validateRequest";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";

const requestSchema = z.object({
  accountId: z.string().nonempty(),
  email: z.string().email(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", requestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const res = await apiClient.api.users.$post({
      json: { accountId: body.accountId, email: body.email },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res), 201);
  },
);

export default app;
