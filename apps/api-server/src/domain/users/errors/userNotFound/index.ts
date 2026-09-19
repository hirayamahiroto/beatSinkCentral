import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserNotFoundError = Error & {
  readonly type: "UserNotFoundError";
};

export const createUserNotFoundError = (): UserNotFoundError =>
  createTypedError("UserNotFoundError");
