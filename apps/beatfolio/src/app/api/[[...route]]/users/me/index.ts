import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";

const updateEmailRequestSchema = z.object({
  email: z.string().nonempty(),
});

const app = new Hono<RequestContextEnv>()
  .get("/", async (c) => {
    const apiClient = c.get("apiClient");

    const res = await apiClient.api.users.me.$get();

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    const data = await res.json();
    return c.json(data);
  })
  .post(
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

      const res = await apiClient.api.users.me.$post({
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
