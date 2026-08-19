import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UnauthorizedError = Error & {
  readonly type: "UnauthorizedError";
};

export const createUnauthorizedError = (): UnauthorizedError =>
  createTypedError("UnauthorizedError");

export const isUnauthorizedError = (
  error: unknown,
): error is UnauthorizedError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "UnauthorizedError";
