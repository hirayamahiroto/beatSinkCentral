import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { updateMyHandle } from "../../../../../../usecases/users/updateMyHandle";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const updateHandleRequestSchema = z.object({
  handle: z
    .string({ required_error: "handle is required" })
    .min(1, "handle is required"),
});

const updateHandleResponseSchema = z.object({
  artistId: z.string(),
  handle: z.string(),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", updateHandleRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => updateMyHandle(caps, { handle: body.handle }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = updateHandleResponseSchema.safeParse(result.value);
    if (!response.success) {
      return handleAppError(
        createResponseContractViolationError(response.error.issues),
        c,
      );
    }

    return c.json(response.data);
  },
);

export default app;
