import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import { toUpstreamError } from "../../../shared/toUpstreamError";

const MAX_GENRES = 20;
const MAX_LINKS = 20;
const MAX_CHAPTERS = 3;

const saveProfileRequestSchema = z.object({
  name: z.string().nullable(),
  tagline: z.string().nullable().optional(),
  activityInfo: z.string().nullable().optional(),
  genres: z.array(z.string()).max(MAX_GENRES),
  chapters: z
    .array(z.object({ questionCode: z.string(), body: z.string() }))
    .max(MAX_CHAPTERS),
  links: z
    .array(z.object({ type: z.string(), url: z.string() }))
    .max(MAX_LINKS),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", saveProfileRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient);
    const artist = apiClient.api.artists[":artistId"];

    const attributesRes = await artist.attributes.$post({
      param: { artistId },
      json: {
        name: body.name,
        tagline: body.tagline,
        genres: body.genres,
        activityInfo: body.activityInfo,
      },
    });
    if (!attributesRes.ok) throw await toUpstreamError(attributesRes);

    for (const chapter of body.chapters) {
      const chapterRes = await artist.story.chapters[":chapterKey"].$post({
        param: { artistId, chapterKey: chapter.questionCode },
        json: { body: chapter.body },
      });
      if (!chapterRes.ok) throw await toUpstreamError(chapterRes);
    }

    const linksRes = await artist.links.$post({
      param: { artistId },
      json: {
        links: body.links.map((link) => ({
          linkTypeCode: link.type,
          url: link.url,
        })),
      },
    });
    if (!linksRes.ok) throw await toUpstreamError(linksRes);

    return c.body(null, 204);
  },
);

export default app;
