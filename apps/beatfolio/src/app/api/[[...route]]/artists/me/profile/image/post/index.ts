import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../../../middlewares/requestContext";
import { resolveMyArtistId } from "../../../../../shared/resolveMyArtistId";

const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
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
    const { file } = c.req.valid("form");

    const resolved = await resolveMyArtistId(apiClient);
    if (!resolved.ok) {
      return c.json(resolved.body, resolved.status);
    }

    const res = await apiClient.api.artists[":artistId"].profile.image.$post({
      param: { artistId: resolved.artistId },
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
