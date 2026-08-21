import { Hono } from "hono";
import publicRoutes from "./public";
import me from "./me";
import artistId from "./[artistId]";

// 公開（認証なし・可変ハンドル accountId）と認証済み（不変 ID artistId）は
// 同じ artist を指すが鍵も認可も別物なので分ける。
// me 系は /artists/:artistId 系への移行が完了するまで併存させる（expand-migrate-contract）
const app = new Hono()
  .route("/", publicRoutes)
  .route("/me", me)
  .route("/:artistId", artistId);

export default app;
