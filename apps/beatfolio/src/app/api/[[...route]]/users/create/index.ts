import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const requestSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  accountId: z.string().min(1),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const res = await apiClient.api.users.$post({
      json: {
        name: body.name,
        email: body.email,
        accountId: body.accountId,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    const data = await res.json();
    return c.json(data, 201);
  }
);

export default app;
