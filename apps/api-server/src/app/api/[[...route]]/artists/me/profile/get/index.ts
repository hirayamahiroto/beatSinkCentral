import { Hono } from "hono";
import { getContainer } from "../../../../../../../infrastructure/container";
import { getMyProfileUseCase } from "../../../../../../../usecases/artistProfiles/getMyProfile";

// GET /artists/me/profile — 本人の編集用にプロフィールを取得（下書き含む）。
// 同パスの POST（保存）は ../post/index.ts に分離（メソッドで状態が変わるだけ）。
const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");
  const { userRepository, artistRepository, artistProfileRepository } =
    getContainer();

  const result = await getMyProfileUseCase(
    { subId: auth0User.sub },
    { userRepository, artistRepository, artistProfileRepository },
  );

  return c.json(result);
});

export default app;
