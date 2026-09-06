import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UnauthorizedError = Error & {
  readonly type: "UnauthorizedError";
};

export const createUnauthorizedError = (): UnauthorizedError =>
  createTypedError("UnauthorizedError");
