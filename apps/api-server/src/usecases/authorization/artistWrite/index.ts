import type {
  CapabilityDeps,
  ResolveActorError,
  ArtistWriteCapabilities,
} from "../../capabilities";
import { toActor } from "../resolution";
import {
  catchAlreadyTaken,
  isAlreadyTakenError,
  type AlreadyTakenError,
} from "../conflict";
import type { Result } from "../../../utils/result";

export const withArtistWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: ArtistWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError | AlreadyTakenError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return catchAlreadyTaken(isAlreadyTakenError, () =>
    deps.runWithArtistWriteCapabilities(actor.value, work),
  );
};
