import type {
  Actor,
  ActorResolution,
  CapabilityDeps,
  IdentityCapabilities,
  ReadCapabilities,
  RegistrationCapabilities,
  ResolveActorError,
  WriteCapabilities,
} from "../capabilities";
import { createUserNotFoundError } from "../../domain/users/errors/userNotFound";
import { createArtistNotFoundError } from "../../domain/artists/errors/artistNotFound";
import {
  isAccountIdAlreadyTakenError,
  type AccountIdAlreadyTakenError,
} from "../../domain/artists/errors/accountIdAlreadyTaken";
import { type Result, ok, err } from "../../utils/result";

export const toActor = (
  resolution: ActorResolution,
): Result<Actor, ResolveActorError> => {
  switch (resolution.status) {
    case "unregistered":
      return err(createUserNotFoundError());
    case "userOnly":
      return err(createArtistNotFoundError());
    case "complete":
      return ok(resolution.actor);
  }
};

export const withIdentityCapabilities = async <T>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: IdentityCapabilities) => Promise<T>,
): Promise<T> => {
  const actorResolution = await deps.resolveActorState(subId);

  return work({ actorResolution });
};

export const withReadCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: ReadCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return work(deps.buildReadCapabilities(actor.value));
};

export const withWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: WriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return deps.runWithWriteCapabilities(actor.value, work);
};

export const withRegistrationCapabilities = async <T, E>(
  deps: CapabilityDeps,
  work: (caps: RegistrationCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | AccountIdAlreadyTakenError>> => {
  try {
    return await deps.runWithRegistrationCapabilities(work);
  } catch (error) {
    if (isAccountIdAlreadyTakenError(error)) return err(error);
    throw error;
  }
};
