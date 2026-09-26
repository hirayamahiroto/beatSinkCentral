import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { createInvalidRequestFormatError } from "../../errors/invalidRequestFormat";
import { throwBffError } from "../../../../../errorMap";

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
      throwBffError(createInvalidRequestFormatError(result.error.issues));
    }
  });
