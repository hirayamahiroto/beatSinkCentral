import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../../../infrastructure/container";
import { saveMyProfileUseCase } from "../../../../../../../usecases/artistProfiles/saveMyProfile";
import { validateRequest } from "../../../../validators/validateRequest";

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
    const {
      userRepository,
      artistRepository,
      artistProfileRepository,
      txRunner,
    } = getContainer();

    const result = await saveMyProfileUseCase(
      { subId: auth0User.sub, ...body },
      { userRepository, artistRepository, artistProfileRepository, txRunner },
    );

    return c.json(result);
  },
);

export default app;
