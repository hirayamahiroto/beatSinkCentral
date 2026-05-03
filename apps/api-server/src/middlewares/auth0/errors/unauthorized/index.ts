import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UnauthorizedError = Error & {
  readonly type: "UnauthorizedError";
};

export const createUnauthorizedError = (): UnauthorizedError =>
  createTypedError("UnauthorizedError");

export const isUnauthorizedError = (
  error: unknown,
): error is UnauthorizedError => {
  return (
    error instanceof Error &&
    (error as Partial<UnauthorizedError>).type === "UnauthorizedError"
  );
};
