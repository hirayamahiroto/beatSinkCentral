import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../../../middlewares/requestContext";

const publishProfileRequestSchema = z.object({
  published: z.boolean(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  zValidator("json", publishProfileRequestSchema, (result, c) => {
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

    const res = await apiClient.api.artists.me.profile.publish.$post({
      json: { published: body.published },
    });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    return c.json(await res.json());
  },
);

export default app;
