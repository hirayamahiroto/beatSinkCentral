import type {
  CapabilityDeps,
  ArtistReadCapabilities,
  ResolveActorError,
} from "../../capabilities";
import { toActor } from "../resolution";
import type { Result } from "../../../utils/result";

export const withArtistReadCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: ArtistReadCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return work(deps.buildArtistReadCapabilities(actor.value));
};
