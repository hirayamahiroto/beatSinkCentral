import { type Result, ok, err } from "../../shared/result";
import type { RegisteredUser } from "../user";

export type UserAlreadyRegisteredError = {
  readonly type: "UserAlreadyRegisteredError";
};

export const assertNotRegistered = (
  existingUser: RegisteredUser | null,
): Result<void, UserAlreadyRegisteredError> =>
  existingUser ? err({ type: "UserAlreadyRegisteredError" }) : ok(undefined);
