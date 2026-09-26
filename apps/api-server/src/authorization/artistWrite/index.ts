import type {
  CapabilityDeps,
  ResolveActorError,
  ArtistWriteCapabilities,
} from "../../capabilities";
import { toAddressedActor } from "../resolution";
import {
  anyAlreadyTaken,
  catchAlreadyTaken,
  type AlreadyTakenError,
} from "../conflict";
import type { Result } from "../../utils/result";

export const withArtistWriteCapabilitiesById = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  artistId: string,
  work: (caps: ArtistWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError | AlreadyTakenError>> => {
  const actor = toAddressedActor(await deps.resolveActorState(subId), artistId);
  if (!actor.ok) return actor;

  return catchAlreadyTaken(anyAlreadyTaken, () =>
    deps.runWithArtistWriteCapabilities(actor.value, work),
  );
};
