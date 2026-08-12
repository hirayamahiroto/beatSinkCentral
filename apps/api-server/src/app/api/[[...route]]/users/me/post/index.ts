import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withWriteCapabilities } from "../../../../../../usecases/authorization";
import { updateMyEmail } from "../../../../../../usecases/users/updateMyEmail";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";

export const updateMyEmailRequestSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .min(1, "email is required"),
});

export type UpdateMyEmailRequestBody = z.infer<
  typeof updateMyEmailRequestSchema
>;

const app = new Hono().post(
  "/",
  validateRequest("json", updateMyEmailRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withWriteCapabilities(
      getCapabilityDeps(),
      auth0User.sub,
      (caps) => updateMyEmail(caps, { email: body.email }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value);
  },
);

export default app;
