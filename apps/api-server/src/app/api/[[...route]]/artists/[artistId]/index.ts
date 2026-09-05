import { Hono } from "hono";
import updateHandle from "./updateHandle";
import getProfile from "./getProfile";
import updateAttributes from "./updateAttributes";
import writeStoryChapter from "./writeStoryChapter";
import replaceLinks from "./replaceLinks";
import choosePresentationPattern from "./choosePresentationPattern";
import publishProfile from "./publishProfile";
import uploadProfileImage from "./uploadProfileImage";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

const app = new Hono()
  .use("*", requireAuthMiddleware)
  .route("/", updateHandle)
  .route("/profile", getProfile)
  .route("/attributes", updateAttributes)
  .route("/story/chapters/:chapterKey", writeStoryChapter)
  .route("/links", replaceLinks)
  .route("/presentation", choosePresentationPattern)
  .route("/profile/publish", publishProfile)
  .route("/profile/image", uploadProfileImage);

export default app;
