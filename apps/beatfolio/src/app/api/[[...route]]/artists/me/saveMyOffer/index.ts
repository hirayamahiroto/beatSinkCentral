import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import { toUpstreamError } from "../../../shared/toUpstreamError";
import { readUpstreamJson } from "../../../shared/readUpstreamJson";

const MAX_CO_PERFORMERS = 20;

const saveOfferRequestSchema = z.object({
  date: z.string().min(1),
  place: z.string().min(1),
  ticketUrl: z.string().min(1),
  comment: z.string().min(1),
  coPerformers: z
    .array(z.object({ name: z.string().min(1), handle: z.string().nullable() }))
    .max(MAX_CO_PERFORMERS),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", saveOfferRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient);

    const res = await apiClient.api.artists[":artistId"].offers.$post({
      param: { artistId },
      json: body,
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res));
  },
);

export default app;
