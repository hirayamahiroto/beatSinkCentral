import { Hono } from "hono";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { listStoryQuestions } from "../../../../../usecases/storyQuestions/listStoryQuestions";
import { handleAppError } from "../../../../../errorMap";

const app = new Hono().get("/", async (c) => {
  const caps = getCapabilityDeps().buildPublicReadCapabilities();

  const result = await listStoryQuestions(caps);

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
