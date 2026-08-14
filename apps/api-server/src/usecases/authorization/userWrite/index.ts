import type {
  CapabilityDeps,
  ResolveUserError,
  UserWriteCapabilities,
} from "../../capabilities";
import {
  isEmailAlreadyTakenError,
  type EmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { toUser } from "../resolution";
import { catchAlreadyTaken } from "../conflict";
import type { Result } from "../../../utils/result";

export const withUserWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: UserWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveUserError | EmailAlreadyTakenError>> => {
  const user = toUser(await deps.resolveActorState(subId));
  if (!user.ok) return user;

  return catchAlreadyTaken(isEmailAlreadyTakenError, () =>
    deps.runWithUserWriteCapabilities(user.value, work),
  );
};
