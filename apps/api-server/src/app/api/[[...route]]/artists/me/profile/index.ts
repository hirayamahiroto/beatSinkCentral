import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../../infrastructure/container";
import { getMyProfileUseCase } from "../../../../../../usecases/artistProfiles/getMyProfile";
import { saveMyProfileUseCase } from "../../../../../../usecases/artistProfiles/saveMyProfile";
import { publishMyProfileUseCase } from "../../../../../../usecases/artistProfiles/publishMyProfile";
import { validateRequest } from "../../../validators/validateRequest";

// 本文系は下書き保存を許すため任意。形式・長さの検証はドメインの Value Object が担う。
export const saveProfileRequestSchema = z.object({
  name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  story: z.string().nullable().optional(),
  activityInfo: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  snsLinks: z.array(z.string()).optional(),
});

export type SaveProfileRequestBody = z.infer<typeof saveProfileRequestSchema>;

// 公開トグル。published: true=公開（最小核を検証）/ false=非公開。
export const publishProfileRequestSchema = z.object({
  published: z.boolean({ required_error: "published is required" }),
});

export type PublishProfileRequestBody = z.infer<
  typeof publishProfileRequestSchema
>;

const app = new Hono()
  .get("/", async (c) => {
    const auth0User = c.get("auth0User");
    const { userRepository, artistRepository, artistProfileRepository } =
      getContainer();

    const result = await getMyProfileUseCase(
      { subId: auth0User.sub },
      { userRepository, artistRepository, artistProfileRepository },
    );

    return c.json(result);
  })
  .post("/", validateRequest("json", saveProfileRequestSchema), async (c) => {
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
  })
  .post(
    "/publish",
    validateRequest("json", publishProfileRequestSchema),
    async (c) => {
      const body = c.req.valid("json");
      const auth0User = c.get("auth0User");
      const {
        userRepository,
        artistRepository,
        artistProfileRepository,
        txRunner,
      } = getContainer();

      const result = await publishMyProfileUseCase(
        { subId: auth0User.sub, published: body.published },
        { userRepository, artistRepository, artistProfileRepository, txRunner },
      );

      return c.json(result);
    },
  );

export default app;
