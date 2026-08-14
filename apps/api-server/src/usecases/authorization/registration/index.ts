import type {
  CapabilityDeps,
  RegistrationCapabilities,
} from "../../capabilities";
import {
  catchAlreadyTaken,
  isAlreadyTakenError,
  type AlreadyTakenError,
} from "../conflict";
import type { Result } from "../../../utils/result";

export const withRegistrationCapabilities = <T, E>(
  deps: CapabilityDeps,
  work: (caps: RegistrationCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | AlreadyTakenError>> =>
  catchAlreadyTaken(isAlreadyTakenError, () =>
    deps.runWithRegistrationCapabilities(work),
  );
