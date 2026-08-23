import type {
  CapabilityDeps,
  ResolveUserError,
  UserWriteCapabilities,
} from "../../capabilities";
import {
  isEmailAlreadyTakenError,
  type EmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { toAddressedUser } from "../resolution";
import { catchAlreadyTaken } from "../conflict";
import type { Result } from "../../../utils/result";

export const withUserWriteCapabilitiesById = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  userId: string,
  work: (caps: UserWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveUserError | EmailAlreadyTakenError>> => {
  const user = toAddressedUser(await deps.resolveActorState(subId), userId);
  if (!user.ok) return user;

  return catchAlreadyTaken(isEmailAlreadyTakenError, () =>
    deps.runWithUserWriteCapabilities(user.value, work),
  );
};
