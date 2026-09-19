import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
};

export const createUserAlreadyRegisteredError =
  (): UserAlreadyRegisteredError =>
    createTypedError("UserAlreadyRegisteredError");
