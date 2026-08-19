import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../../middlewares/requestContext";

const MAX_GENRES = 20;
const MAX_LINKS = 20;

const saveProfileRequestSchema = z.object({
  name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  story: z.string().nullable().optional(),
  activityInfo: z.string().nullable().optional(),
  genres: z.array(z.string()).max(MAX_GENRES).optional(),
  links: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
        label: z.string().nullable().optional(),
      }),
    )
    .max(MAX_LINKS)
    .optional(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  zValidator("json", saveProfileRequestSchema, (result, c) => {
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

    const res = await apiClient.api.artists.me.profile.$post({ json: body });

    if (!res.ok) {
      const error = await res.json();
      return c.json(error, res.status);
    }

    return c.json(await res.json());
  },
);

export default app;
