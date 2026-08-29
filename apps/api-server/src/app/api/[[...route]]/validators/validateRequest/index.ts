import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { createInvalidRequestFormatError } from "../../errors/invalidRequestFormat";

type ValidationTarget = "json" | "form" | "param" | "query" | "header";

export const validateRequest = <
  Target extends ValidationTarget,
  Schema extends ZodSchema,
>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw createInvalidRequestFormatError(result.error.issues);
    }
  });
