import type {
  CapabilityDeps,
  ArtistReadCapabilities,
  ResolveActorError,
} from "../../capabilities";
import { toAddressedActor } from "../resolution";
import type { Result } from "../../../utils/result";

export const withArtistReadCapabilitiesById = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  artistId: string,
  work: (caps: ArtistReadCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toAddressedActor(await deps.resolveActorState(subId), artistId);
  if (!actor.ok) return actor;

  return work(deps.buildArtistReadCapabilities(actor.value));
};
