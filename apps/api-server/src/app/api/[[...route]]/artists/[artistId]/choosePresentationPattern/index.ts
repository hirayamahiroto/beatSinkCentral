import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { choosePresentationPattern } from "../../../../../../usecases/artistProfiles/choosePresentationPattern";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

export const choosePresentationPatternRequestSchema = z.object({
  patternCode: z.string().min(1).max(50),
});

const choosePresentationPatternResponseSchema = z.object({
  presentation: z.object({
    patternCode: z.string().nullable(),
  }),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", choosePresentationPatternRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => choosePresentationPattern(caps, body),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = choosePresentationPatternResponseSchema.safeParse(
      result.value,
    );
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
