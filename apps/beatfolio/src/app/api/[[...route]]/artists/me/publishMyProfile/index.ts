import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import { toUpstreamError } from "../../../shared/toUpstreamError";
import { readUpstreamJson } from "../../../shared/readUpstreamJson";

const publishProfileRequestSchema = z.object({
  published: z.boolean(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", publishProfileRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient);

    const res = await apiClient.api.artists[":artistId"].profile.publish.$post({
      param: { artistId },
      json: { published: body.published },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res));
  },
);

export default app;
