import type { CapabilityDeps, IdentityCapabilities } from "../../capabilities";

export const withIdentityCapabilities = async <T>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: IdentityCapabilities) => Promise<T>,
): Promise<T> => {
  const actorResolution = await deps.resolveActorState(subId);

  return work({ actorResolution });
};
