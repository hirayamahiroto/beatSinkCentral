import { Hono } from "hono";
import { handle } from "hono/vercel";
import test from "./test";
import usersCreate from "./users/create";
import usersMe from "./users/me";
import artistsMe from "./artists/me";
import artistsMeProfile from "./artists/me/profile";
import artistsDetail from "./artists/detail";
import { requireAuthMiddleware } from "../../../middlewares/auth0";
import { handleAppError } from "../../../errorMap";

// 認証は保護プレフィックスにのみ適用する。
// 公開詳細（GET /artists/:accountId）は未ログインでも閲覧できるよう、
// auth ミドルウェアの対象から外す（Top Page / プレイヤー閲覧は公開）。
const app = new Hono()
  .basePath("/api")
  .use("/test", requireAuthMiddleware)
  .use("/users", requireAuthMiddleware)
  .use("/users/*", requireAuthMiddleware)
  .use("/artists/me", requireAuthMiddleware)
  .use("/artists/me/*", requireAuthMiddleware)
  .route("/test", test)
  .route("/users/me", usersMe)
  .route("/users", usersCreate)
  // 具体的な静的ルートを先に、パラメータルート（/:accountId）を後に登録する。
  .route("/artists/me/profile", artistsMeProfile)
  .route("/artists/me", artistsMe)
  .route("/artists", artistsDetail)
  .onError(handleAppError);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
