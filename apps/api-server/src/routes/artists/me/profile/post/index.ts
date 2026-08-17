import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilities } from "../../../../../usecases/authorization/artistWrite";
import { saveMyProfile } from "../../../../../usecases/artistProfiles/saveMyProfile";
import { validateRequest } from "../../../../validators/validateRequest";
import { handleAppError } from "../../../../../errorMap";

export const saveProfileRequestSchema = z.object({
  name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  story: z.string().nullable().optional(),
  activityInfo: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
        label: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export type SaveProfileRequestBody = z.infer<typeof saveProfileRequestSchema>;

const app = new Hono().post(
  "/",
  validateRequest("json", saveProfileRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilities(
      getCapabilityDeps(),
      auth0User.sub,
      (caps) => saveMyProfile(caps, body),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value);
  },
);

export default app;
