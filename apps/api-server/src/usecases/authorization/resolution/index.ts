import type {
  Actor,
  ActorResolution,
  ResolveActorError,
  ResolveUserError,
} from "../../capabilities";
import type { User } from "../../../domain/users/entities";
import { createUserNotFoundError } from "../../../domain/users/errors/userNotFound";
import { createArtistNotFoundError } from "../../../domain/artists/errors/artistNotFound";
import { type Result, ok, err } from "../../../utils/result";

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

export const toAddressedActor = (
  resolution: ActorResolution,
  artistId: string,
): Result<Actor, ResolveActorError> => {
  const actor = toActor(resolution);
  if (!actor.ok) return actor;
  if (actor.value.artist.getArtistId() !== artistId) {
    return err(createArtistNotFoundError());
  }
  return actor;
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
