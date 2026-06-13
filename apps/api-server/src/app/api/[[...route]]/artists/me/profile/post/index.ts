import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../../../infrastructure/container";
import { saveMyProfileUseCase } from "../../../../../../../usecases/artistProfiles/saveMyProfile";
import { validateRequest } from "../../../../validators/validateRequest";

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

// POST /artists/me/profile — 本人のプロフィールを作成 / 更新（upsert）。
// 同パスの GET（取得）は ../get/index.ts に分離。
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
