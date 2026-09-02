import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { saveMyProfile } from "../../../../../../usecases/artistProfiles/saveMyProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const MAX_GENRES = 20;
const MAX_LINKS = 20;
const MAX_CHAPTERS = 3;

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const storyChapterRequestSchema = z.object({
  questionCode: z.string(),
  body: z.string(),
});

export const saveProfileRequestSchema = z.object({
  name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  chapters: z.array(storyChapterRequestSchema).max(MAX_CHAPTERS).optional(),
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

export type SaveProfileRequestBody = z.infer<typeof saveProfileRequestSchema>;

const storyChapterResponseSchema = z.object({
  questionCode: z.string(),
  body: z.string(),
});

const saveProfileResponseSchema = z.object({
  handle: z.string(),
  profile: z.object({
    name: z.string().nullable(),
    tagline: z.string().nullable(),
    imageUrl: z.string().nullable(),
    chapters: z.array(storyChapterResponseSchema),
    activityInfo: z.string().nullable(),
    genres: z.array(z.string()),
    links: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
        label: z.string().nullable(),
      }),
    ),
    published: z.boolean(),
  }),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", saveProfileRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => saveMyProfile(caps, body),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = saveProfileResponseSchema.safeParse(result.value);
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
