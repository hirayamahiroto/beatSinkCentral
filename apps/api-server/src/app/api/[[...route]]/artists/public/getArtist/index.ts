import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { getPublicProfile } from "../../../../../../usecases/artistProfiles/getPublicProfile";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  accountId: z.string().min(1).max(255),
});

const publicProfileSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().nullable(),
  imageUrl: z.string().nullable(),
  story: z.string().nullable(),
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
});

const getArtistResponseSchema = z.object({
  accountId: z.string(),
  profile: publicProfileSchema,
});

const app = new Hono().get(
  "/",
  validateRequest("param", paramSchema),
  async (c) => {
    const { accountId } = c.req.valid("param");
    const caps = getCapabilityDeps().buildPublicReadCapabilities();

    const result = await getPublicProfile(caps, { accountId });

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
