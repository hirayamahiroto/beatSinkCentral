import { createTypedError } from "../../../../utils/errors/createTypedError";

export type EmailAlreadyTakenError = Error & {
  readonly type: "EmailAlreadyTakenError";
};

export const createEmailAlreadyTakenError = (): EmailAlreadyTakenError =>
  createTypedError("EmailAlreadyTakenError");

export const isEmailAlreadyTakenError = (
  error: unknown,
): error is EmailAlreadyTakenError => {
  return (
    error instanceof Error &&
    (error as Partial<EmailAlreadyTakenError>).type === "EmailAlreadyTakenError"
  );
};
