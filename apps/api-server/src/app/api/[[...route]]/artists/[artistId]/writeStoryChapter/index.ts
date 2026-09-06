import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { writeMyStoryChapter } from "../../../../../../usecases/artistProfiles/writeMyStoryChapter";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
  chapterKey: z.string().min(1).max(50),
});

export const writeStoryChapterRequestSchema = z.object({
  body: z.string({ required_error: "body is required" }),
});

export type WriteStoryChapterRequestBody = z.infer<
  typeof writeStoryChapterRequestSchema
>;

const writeStoryChapterResponseSchema = z.object({
  story: z.object({
    chapters: z.array(z.object({ key: z.string(), body: z.string() })),
  }),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", writeStoryChapterRequestSchema),
  async (c) => {
    const { artistId, chapterKey } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => writeMyStoryChapter(caps, { chapterKey, body: body.body }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = writeStoryChapterResponseSchema.safeParse(result.value);
    if (!response.success) {
      return handleAppError(
        createResponseContractViolationError(response.error.issues),
        c,
      );
    }

    return c.json(response.data);
  },
);

export default app;
