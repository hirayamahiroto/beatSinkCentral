import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { replaceMyLinks } from "../../../../../../usecases/artistProfiles/replaceMyLinks";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const MAX_LINKS = 20;

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const linkSchema = z.object({
  linkTypeCode: z.string(),
  url: z.string(),
});

export const replaceLinksRequestSchema = z.object({
  links: z.array(linkSchema).max(MAX_LINKS),
});

export type ReplaceLinksRequestBody = z.infer<typeof replaceLinksRequestSchema>;

const replaceLinksResponseSchema = z.object({
  links: z.array(linkSchema),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", replaceLinksRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => replaceMyLinks(caps, { links: body.links }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = replaceLinksResponseSchema.safeParse(result.value);
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
