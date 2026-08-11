import { Hono } from "hono";
import test from "./routes/test";
import usersCreate from "./routes/users/create";
import usersMe from "./routes/users/me";
import artistsMe from "./routes/artists/me";
import getMyProfile from "./routes/artists/me/profile/get";
import saveMyProfile from "./routes/artists/me/profile/post";
import publishMyProfile from "./routes/artists/me/profile/publish/post";
import listPublicProfiles from "./routes/artists/get";
import getPublicProfile from "./routes/artists/detail/get";
import listLinkTypes from "./routes/link-types/get";
import { basicAuthMiddleware } from "./middlewares/basicAuth";
import { requireAuthMiddleware } from "./middlewares/auth0";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { handleAppError } from "./errorMap";

const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .use("*", basicAuthMiddleware)
  .use("/test", requireAuthMiddleware)
  .use("/users", requireAuthMiddleware)
  .use("/users/*", requireAuthMiddleware)
  .use("/artists/me", requireAuthMiddleware)
  .use("/artists/me/*", requireAuthMiddleware)
  .route("/test", test)
  .route("/users/me", usersMe)
  .route("/users", usersCreate)
  .route("/artists/me/profile", getMyProfile)
  .route("/artists/me/profile", saveMyProfile)
  .route("/artists/me/profile/publish", publishMyProfile)
  .route("/artists/me", artistsMe)
  .route("/artists", listPublicProfiles)
  .route("/artists", getPublicProfile)
  .route("/link-types", listLinkTypes)
  .onError(handleAppError);

export type AppType = typeof app;

export default app;
