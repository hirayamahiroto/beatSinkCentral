import type {
  CapabilityDeps,
  ResolveUserError,
  UserWriteCapabilities,
} from "../../capabilities";
import type { EmailAlreadyTakenError } from "../../domain/users/errors/emailAlreadyTaken";
import { toAddressedUser } from "../resolution";
import { type AlreadyTakenError, catchAlreadyTaken } from "../conflict";
import type { Result } from "../../utils/result";

const emailAlreadyTakenOnly = (
  conflict: AlreadyTakenError,
): EmailAlreadyTakenError | null =>
  conflict.type === "EmailAlreadyTakenError" ? conflict : null;

export const withUserWriteCapabilitiesById = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  userId: string,
  work: (caps: UserWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveUserError | EmailAlreadyTakenError>> => {
  const user = toAddressedUser(await deps.resolveActorState(subId), userId);
  if (!user.ok) return user;

  return catchAlreadyTaken(emailAlreadyTakenOnly, () =>
    deps.runWithUserWriteCapabilities(user.value, work),
  );
};
