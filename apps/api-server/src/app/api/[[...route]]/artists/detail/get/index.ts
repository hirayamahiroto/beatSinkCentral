import { Hono } from "hono";
import { getContainer } from "../../../../../../infrastructure/container";
import { getPublicProfileUseCase } from "../../../../../../usecases/artistProfiles/getPublicProfile";

// GET /artists/:accountId — 公開詳細ページ用。認証不要（誰でも閲覧可）。published のみ返す。
// 非公開・未作成・存在しない accountId は usecase 側で 404（ArtistProfileNotFoundError）。
const app = new Hono().get("/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const { artistProfileRepository } = getContainer();

  const result = await getPublicProfileUseCase(
    { accountId },
    { artistProfileRepository },
  );

  return c.json(result);
});

export default app;
