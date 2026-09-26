import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { listLinkTypes } from "../../../../../usecases/linkTypes/listLinkTypes";
import { handleAppError } from "../../../../../errorMap";
import { createResponseContractViolationError } from "../../errors/responseContractViolation";

const listLinkTypesResponseSchema = z.object({
  linkTypes: z.array(z.object({ type: z.string(), label: z.string() })),
});

const app = new Hono().get("/", async (c) => {
  const caps = getCapabilityDeps().buildPublicReadCapabilities();

  const result = await listLinkTypes(caps);

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  const response = listLinkTypesResponseSchema.safeParse(result.value);
  if (!response.success) {
    return handleAppError(
      createResponseContractViolationError(response.error.issues),
      c,
    );
  }

  return c.json(response.data);
});

export default app;
