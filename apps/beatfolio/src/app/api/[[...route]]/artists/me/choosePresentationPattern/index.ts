import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import { toUpstreamError } from "../../../shared/toUpstreamError";
import { readUpstreamJson } from "../../../shared/readUpstreamJson";

const choosePresentationPatternRequestSchema = z.object({
  patternCode: z.string().min(1).max(50),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", choosePresentationPatternRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient);

    const res = await apiClient.api.artists[":artistId"].presentation.$post({
      param: { artistId },
      json: { patternCode: body.patternCode },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res));
  },
);

export default app;
