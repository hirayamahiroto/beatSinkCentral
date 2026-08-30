import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { resolveMyUserId } from "../../../shared/resolveMyUserId";

const updateEmailRequestSchema = z.object({
  email: z.string().nonempty(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  zValidator("json", updateEmailRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const resolved = await resolveMyUserId(apiClient);
    if (!resolved.ok) {
      return c.json(resolved.body, resolved.status);
    }

    const res = await apiClient.api.users[":userId"].$post({
      param: { userId: resolved.userId },
      json: { email: body.email },
    });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    const data = await res.json();
    return c.json(data);
  },
);

export default app;
