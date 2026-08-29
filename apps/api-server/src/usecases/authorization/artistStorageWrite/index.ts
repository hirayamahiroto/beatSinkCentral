import type {
  CapabilityDeps,
  ArtistStorageWriteCapabilities,
  ResolveActorError,
} from "../../capabilities";
import { toAddressedActor } from "../resolution";
import type { Result } from "../../../utils/result";

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
