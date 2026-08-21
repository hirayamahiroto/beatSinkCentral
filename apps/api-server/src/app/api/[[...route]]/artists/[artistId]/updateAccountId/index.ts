import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withArtistWriteCapabilitiesById } from "../../../../../../usecases/authorization/artistWrite";
import { updateMyAccountId } from "../../../../../../usecases/users/updateMyAccountId";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";
import { requireAuthMiddleware } from "../../../../../../middlewares/auth0";

const paramSchema = z.object({
  artistId: z.string().min(1).max(255),
});

export const updateAccountIdRequestSchema = z.object({
  accountId: z
    .string({ required_error: "accountId is required" })
    .min(1, "accountId is required"),
});

export type UpdateAccountIdRequestBody = z.infer<
  typeof updateAccountIdRequestSchema
>;

const updateAccountIdResponseSchema = z.object({
  artistId: z.string(),
  accountId: z.string(),
});

const app = new Hono().post(
  "/",
  requireAuthMiddleware,
  validateRequest("param", paramSchema),
  validateRequest("json", updateAccountIdRequestSchema),
  async (c) => {
    const { artistId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withArtistWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      artistId,
      (caps) => updateMyAccountId(caps, { accountId: body.accountId }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = updateAccountIdResponseSchema.safeParse(result.value);
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
