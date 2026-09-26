import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { createInvalidRequestFormatError } from "../../errors/invalidRequestFormat";
import { throwAppError } from "../../../../../errorMap";

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
      throwAppError(createInvalidRequestFormatError(result.error.issues));
    }
  });
