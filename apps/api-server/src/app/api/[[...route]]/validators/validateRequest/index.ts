import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { createInvalidRequestFormatError } from "../../errors/invalidRequestFormat";

type ValidationTarget = "json";

export const validateRequest = <Schema extends ZodSchema>(
  target: ValidationTarget,
  schema: Schema
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw createInvalidRequestFormatError(result.error.issues);
    }
  });
