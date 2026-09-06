import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { replaceMyOffer } from "../../../../../../usecases/offers/replaceMyOffer";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const MAX_CO_PERFORMERS = 20;

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

const replaceOfferRequestSchema = z.object({
  date: z.string(),
  place: z.string(),
  ticketUrl: z.string(),
  comment: z.string(),
  coPerformers: z
    .array(z.object({ name: z.string(), handle: z.string().nullable() }))
    .max(MAX_CO_PERFORMERS),
});

const replaceOfferResponseSchema = z.object({
  offer: z.object({
    date: z.string(),
    place: z.string(),
    ticketUrl: z.string(),
    comment: z.string(),
    coPerformers: z.array(
      z.object({ name: z.string(), handle: z.string().nullable() }),
    ),
  }),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", replaceOfferRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => replaceMyOffer(caps, body),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = replaceOfferResponseSchema.safeParse(result.value);
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
