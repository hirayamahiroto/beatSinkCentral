import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../../../../infrastructure/container";
import { publishMyProfileUseCase } from "../../../../../../../../usecases/artistProfiles/publishMyProfile";
import { validateRequest } from "../../../../../validators/validateRequest";

// 公開トグル。published: true=公開（最小核を検証）/ false=非公開。
export const publishProfileRequestSchema = z.object({
  published: z.boolean({ required_error: "published is required" }),
});

export type PublishProfileRequestBody = z.infer<
  typeof publishProfileRequestSchema
>;

// POST /artists/me/profile/publish — 公開 / 非公開を切り替えるアクション
// （使用例テーブルの「POST /users/:id/delete」と同じく、アクションは POST + パス接尾辞）。
const app = new Hono().post(
  "/",
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
