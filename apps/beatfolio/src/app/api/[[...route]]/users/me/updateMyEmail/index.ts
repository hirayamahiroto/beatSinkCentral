import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyUserId } from "../../../shared/resolveMyUserId";
import { toUpstreamError } from "../../../shared/toUpstreamError";
import { readUpstreamJson } from "../../../shared/readUpstreamJson";

const updateEmailRequestSchema = z.object({
  email: z.string().nonempty(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", updateEmailRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const userId = await resolveMyUserId(apiClient);

    const res = await apiClient.api.users[":userId"].$post({
      param: { userId },
      json: { email: body.email },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res));
  },
);

export default app;
