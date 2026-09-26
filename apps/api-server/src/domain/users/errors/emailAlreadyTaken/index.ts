import { createTypedError } from "../../../../utils/errors/createTypedError";

export type EmailAlreadyTakenError = Error & {
  readonly type: "EmailAlreadyTakenError";
};

export const createEmailAlreadyTakenError = (): EmailAlreadyTakenError =>
  createTypedError("EmailAlreadyTakenError");
