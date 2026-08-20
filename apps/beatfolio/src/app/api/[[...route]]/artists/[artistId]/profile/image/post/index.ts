import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../../../middlewares/requestContext";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const app = new Hono<RequestContextEnv>().post(
  "/:artistId/profile/image",
  zValidator("param", paramSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400,
      );
    }
  }),
  zValidator("form", uploadProfileImageRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const apiClient = c.get("apiClient");
    const { artistId } = c.req.valid("param");
    const { file } = c.req.valid("form");

    const res = await apiClient.api.artists[":artistId"].profile.image.$post({
      param: { artistId },
      form: { file },
    });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    return c.json(await res.json());
  },
);

export default app;
