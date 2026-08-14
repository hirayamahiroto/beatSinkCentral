import type {
  Actor,
  ActorResolution,
  CapabilityDeps,
  IdentityCapabilities,
  ReadCapabilities,
  RegistrationCapabilities,
  ResolveActorError,
  ResolveUserError,
  UserWriteCapabilities,
  WriteCapabilities,
} from "../capabilities";
import type { User } from "../../domain/users/entities";
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

export const toUser = (
  resolution: ActorResolution,
): Result<User, ResolveUserError> => {
  switch (resolution.status) {
    case "unregistered":
      return err(createUserNotFoundError());
    case "userOnly":
      return ok(resolution.user);
    case "complete":
      return ok(resolution.actor.user);
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

export const withUserWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: UserWriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveUserError>> => {
  const user = toUser(await deps.resolveActorState(subId));
  if (!user.ok) return user;

  return deps.runWithUserWriteCapabilities(user.value, work);
};

const catchTakenAccountId = async <T, E>(
  run: () => Promise<Result<T, E>>,
): Promise<Result<T, E | AccountIdAlreadyTakenError>> => {
  try {
    return await run();
  } catch (error) {
    if (isAccountIdAlreadyTakenError(error)) return err(error);
    throw error;
  }
};

export const withWriteCapabilities = async <T, E>(
  deps: CapabilityDeps,
  subId: string,
  work: (caps: WriteCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | ResolveActorError | AccountIdAlreadyTakenError>> => {
  const actor = toActor(await deps.resolveActorState(subId));
  if (!actor.ok) return actor;

  return catchTakenAccountId(() =>
    deps.runWithWriteCapabilities(actor.value, work),
  );
};

export const withRegistrationCapabilities = <T, E>(
  deps: CapabilityDeps,
  work: (caps: RegistrationCapabilities) => Promise<Result<T, E>>,
): Promise<Result<T, E | AccountIdAlreadyTakenError>> =>
  catchTakenAccountId(() => deps.runWithRegistrationCapabilities(work));
