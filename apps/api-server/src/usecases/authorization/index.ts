import type {
  CapabilityDeps,
  ReadCapabilities,
  ResolveActorError,
  WriteCapabilities,
} from "../capabilities";
import type { Result } from "../../utils/result";

export const withReadCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: ReadCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = await deps.resolveActor(subId);
  if (!actor.ok) return actor;

  return work(deps.buildReadCapabilities(actor.value));
};

export const withWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: WriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = await deps.resolveActor(subId);
  if (!actor.ok) return actor;

  return deps.runWithWriteCapabilities(actor.value, work);
};
