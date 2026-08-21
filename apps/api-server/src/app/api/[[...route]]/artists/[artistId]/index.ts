import { Hono } from "hono";
import updateAccountId from "./updateAccountId";
import getProfile from "./getProfile";
import saveProfile from "./saveProfile";
import publishProfile from "./publishProfile";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

// 裸の "/" は公開ルート GET /:accountId と同じ形状で衝突するため、
// ここでは "*" ではなく "/profile/*" にだけ適用する（"/" 側は updateAccountId が自前で適用する）。
const app = new Hono()
  .use("/profile/*", requireAuthMiddleware)
  .route("/", updateAccountId)
  .route("/profile", getProfile)
  .route("/profile", saveProfile)
  .route("/profile/publish", publishProfile);

export default app;
