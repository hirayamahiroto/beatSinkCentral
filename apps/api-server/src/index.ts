import { Hono } from "hono";
import test from "./routes/test";
import users from "./routes/users";
import artists from "./routes/artists";
import linkTypes from "./routes/link-types";
import { basicAuthMiddleware } from "./middlewares/basicAuth";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { handleRequestError } from "./errorMap";

const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .use("*", basicAuthMiddleware)
  .route("/test", test)
  .route("/users", users)
  .route("/artists", artists)
  .route("/link-types", linkTypes)
  .onError(handleRequestError);

export type AppType = typeof app;

export default app;
