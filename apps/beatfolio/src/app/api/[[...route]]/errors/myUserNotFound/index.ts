import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type MyUserNotFoundError = Error & {
  readonly type: "MyUserNotFoundError";
};

export const createMyUserNotFoundError = (): MyUserNotFoundError =>
  createTypedError("MyUserNotFoundError");
