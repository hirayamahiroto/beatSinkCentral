import { type Result, err, flatMap, map } from "../../result";
import { createSub, type InvalidSubFormatError } from "../../valueObjects/sub";
import {
  createEmail,
  type InvalidEmailFormatError,
} from "../../valueObjects/email";
import type { RegisteredUser } from "../../user";

export type UserAlreadyRegisteredError = {
  readonly type: "UserAlreadyRegisteredError";
};

export type RegisterUserError =
  | InvalidSubFormatError
  | InvalidEmailFormatError
  | UserAlreadyRegisteredError;

export type RegisterUserInput = {
  readonly sub: string;
  readonly email: string;
};

export const registerUser = (
  input: RegisterUserInput,
  existingUser: RegisteredUser | null,
  newId: string,
): Result<RegisteredUser, RegisterUserError> => {
  if (existingUser) {
    return err({ type: "UserAlreadyRegisteredError" });
  }

  return flatMap(createSub(input.sub), (sub) =>
    map(createEmail(input.email), (email) => ({
      status: "registered" as const,
      id: newId,
      sub,
      email,
    })),
  );
};
