import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../../../middlewares/requestContext";
import { resolveMyArtistId } from "../../../../../shared/resolveMyArtistId";
import { resolvePublishRequirementLabels } from "../../../../../shared/resolvePublishRequirementLabels";

const publishProfileRequestSchema = z.object({
  published: z.boolean(),
});

const notPublishableErrorSchema = z.object({
  error: z.string(),
  details: z.object({ missingFields: z.array(z.string()) }),
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

    const resolved = await resolveMyArtistId(apiClient);
    if (!resolved.ok) {
      return c.json(resolved.body, resolved.status);
    }

    const res = await apiClient.api.artists[":artistId"].profile.publish.$post({
      param: { artistId: resolved.artistId },
      json: { published: body.published },
    });

    if (!res.ok) {
      const error = await res.json();
      const notPublishable = notPublishableErrorSchema.safeParse(error);

      if (notPublishable.success) {
        return c.json(
          {
            error: notPublishable.data.error,
            missingRequirements: resolvePublishRequirementLabels(
              notPublishable.data.details.missingFields,
            ),
          },
          res.status,
        );
      }

      return c.json(error, res.status);
    }

    return c.json(await res.json());
  },
);

export default app;
