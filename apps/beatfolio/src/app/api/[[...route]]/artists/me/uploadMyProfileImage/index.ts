import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import { toUpstreamError } from "../../../shared/toUpstreamError";
import { readUpstreamJson } from "../../../shared/readUpstreamJson";

const uploadProfileImageRequestSchema = z.object({
  file: z.instanceof(File),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("form", uploadProfileImageRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const { file } = c.req.valid("form");

    const artistId = await resolveMyArtistId(apiClient);

    const res = await apiClient.api.artists[":artistId"].profile.image.$post({
      param: { artistId },
      form: { file },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.json(await readUpstreamJson(res));
  },
);

export default app;
