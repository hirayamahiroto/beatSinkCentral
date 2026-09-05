import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { getPublicProfile } from "../../../../../../usecases/artistProfiles/getPublicProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  handle: z.string().min(1).max(255),
});

const publicProfileSchema = z.object({
  attributes: z.object({
    name: z.string().min(1),
    imageUrl: z.string().min(1),
    tagline: z.string().nullable(),
    genres: z.array(z.string()).min(1),
    activityInfo: z.string().nullable(),
  }),
  story: z.object({
    chapters: z.array(z.object({ key: z.string(), body: z.string() })).min(1),
  }),
  links: z
    .array(z.object({ linkTypeCode: z.string(), url: z.string() }))
    .min(1),
  presentation: z.object({ patternCode: z.string().nullable() }),
  published: z.literal(true),
});

const getArtistResponseSchema = z.object({
  handle: z.string(),
  profile: publicProfileSchema,
});

const app = new Hono().get(
  "/",
  validateRequest("param", paramSchema),
  async (c) => {
    const { handle } = c.req.valid("param");
    const caps = getCapabilityDeps().buildPublicReadCapabilities();

    const result = await getPublicProfile(caps, { handle });

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = getArtistResponseSchema.safeParse(result.value);
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
