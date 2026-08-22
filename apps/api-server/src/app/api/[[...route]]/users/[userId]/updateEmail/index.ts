import { Hono } from "hono";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../../infrastructure/capabilities";
import { withUserWriteCapabilitiesById } from "../../../../../../usecases/authorization/userWrite";
import { updateMyEmail } from "../../../../../../usecases/users/updateMyEmail";
import { validateRequest } from "../../../validators/validateRequest";
import { handleAppError } from "../../../../../../errorMap";
import { createResponseContractViolationError } from "../../../errors/responseContractViolation";

const paramSchema = z.object({
  userId: z.string().min(1).max(255),
});

export const updateEmailRequestSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .min(1, "email is required"),
});

export type UpdateEmailRequestBody = z.infer<typeof updateEmailRequestSchema>;

const updateEmailResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
});

const app = new Hono().post(
  "/",
  validateRequest("param", paramSchema),
  validateRequest("json", updateEmailRequestSchema),
  async (c) => {
    const { userId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const result = await withUserWriteCapabilitiesById(
      getCapabilityDeps(),
      auth0User.sub,
      userId,
      (caps) => updateMyEmail(caps, { email: body.email }),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    const response = updateEmailResponseSchema.safeParse(result.value);
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
