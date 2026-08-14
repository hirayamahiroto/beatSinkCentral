import { Hono } from "hono";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { listLinkTypes } from "../../../../../usecases/linkTypes/listLinkTypes";
import { handleAppError } from "../../../../../errorMap";

const app = new Hono().get("/", async (c) => {
  const caps = getCapabilityDeps().buildPublicReadCapabilities();

  const result = await listLinkTypes(caps);

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
