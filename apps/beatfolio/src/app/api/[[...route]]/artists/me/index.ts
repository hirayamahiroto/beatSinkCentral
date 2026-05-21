import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const updateAccountIdRequestSchema = z.object({
  accountId: z.string().nonempty(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  zValidator("json", updateAccountIdRequestSchema, (result, c) => {
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

    const res = await apiClient.api.artists.me.$post({
      json: { accountId: body.accountId },
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
