import type {
  CapabilityDeps,
  ArtistStorageWriteCapabilities,
  ResolveActorError,
} from "../../capabilities";
import { toActor, toAddressedActor } from "../resolution";
import type { Result } from "../../../utils/result";

export const withArtistStorageWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: ArtistStorageWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return work(deps.buildArtistStorageWriteCapabilities(actor.value));
};

export const withArtistStorageWriteCapabilitiesById = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  artistId: string,
  work: (caps: ArtistStorageWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toAddressedActor(await deps.resolveActorState(subId), artistId);
  if (!actor.ok) return actor;

  return work(deps.buildArtistStorageWriteCapabilities(actor.value));
};
