import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withWriteCapabilities } from "../../../../../../usecases/authorization";
import { updateMyAccountId } from "../../../../../../usecases/users/updateMyAccountId";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";

export const updateMyAccountIdRequestSchema = z.object({
  accountId: z
    .string({ required_error: "accountId is required" })
    .min(1, "accountId is required"),
});

export type UpdateMyAccountIdRequestBody = z.infer<
  typeof updateMyAccountIdRequestSchema
>;

const app = new Hono().post(
  "/",
  validateRequest("json", updateMyAccountIdRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withWriteCapabilities(
      getCapabilityDeps(),
      auth0User.sub,
      (caps) => updateMyAccountId(caps, { accountId: body.accountId }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value);
  },
);

export default app;
