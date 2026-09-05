import { Hono } from "hono";
import { z } from "zod";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { validateRequest } from "../../../validators/validateRequest";
import { resolveMyArtistId } from "../../../shared/resolveMyArtistId";
import {
  toUpstreamError,
  type UpstreamResponse,
} from "../../../shared/toUpstreamError";
import {
  createPartialSaveFailedError,
  type UpstreamFailure,
} from "../../../errors/partialSaveFailed";
import { isUpstreamUnavailableError } from "../../../../../../utils/client/errors/upstreamUnavailable";
import {
  chapterStep,
  type SaveStep,
} from "../../../../../../libs/saveProfileProgress";

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

type StepResponse = UpstreamResponse & { ok: boolean };

const createSaveSteps = () => {
  const saved: SaveStep[] = [];

  const run = async (
    step: SaveStep,
    send: () => Promise<StepResponse>,
  ): Promise<void> => {
    const fail = (upstream: UpstreamFailure) =>
      createPartialSaveFailedError({
        saved: [...saved],
        failedAt: step,
        upstream,
      });

    let res: StepResponse;
    try {
      res = await send();
    } catch (error) {
      if (isUpstreamUnavailableError(error)) throw fail(error);
      throw error;
    }
    if (!res.ok) throw fail(await toUpstreamError(res));
    saved.push(step);
  };

  return { run };
};

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", saveProfileRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient);
    const artist = apiClient.api.artists[":artistId"];
    const steps = createSaveSteps();

    await steps.run("attributes", () =>
      artist.attributes.$post({
        param: { artistId },
        json: {
          name: body.name,
          tagline: body.tagline,
          genres: body.genres,
          activityInfo: body.activityInfo,
        },
      }),
    );

    for (const chapter of body.chapters) {
      await steps.run(chapterStep(chapter.questionCode), () =>
        artist.story.chapters[":chapterKey"].$post({
          param: { artistId, chapterKey: chapter.questionCode },
          json: { body: chapter.body },
        }),
      );
    }

    await steps.run("links", () =>
      artist.links.$post({
        param: { artistId },
        json: {
          links: body.links.map((link) => ({
            linkTypeCode: link.type,
            url: link.url,
          })),
        },
      }),
    );

    return c.body(null, 204);
  },
);

export default app;
