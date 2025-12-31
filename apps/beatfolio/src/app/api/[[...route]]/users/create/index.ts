import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const requestSchema = z.object({
  username: z.string().min(1),
  attributes: z.record(z.unknown()).optional(),
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
        username: body.username,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status as 400 | 401 | 500);
    }

    const data = await res.json();
    return c.json(data, 201);
  }
);

export default app;
