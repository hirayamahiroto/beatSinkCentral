import type { User } from "../../domain/users/entities";
import type { Artist } from "../../domain/artists/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../domain/artistProfiles/repositories";
import type { UserNotFoundError } from "../../domain/users/errors/userNotFound";
import type { ArtistNotFoundError } from "../../domain/artists/errors/artistNotFound";
import type { Result } from "../../utils/result";

export type Actor = {
  readonly user: User;
  readonly artist: Artist;
};

export type ResolveActorError = UserNotFoundError | ArtistNotFoundError;

export type PublicReadCapabilities = {
  artistProfiles: IArtistProfileReader;
};

export type ReadCapabilities = {
  actor: Actor;
  artistProfiles: IArtistProfileReader;
};

export type WriteCapabilities = {
  actor: Actor;
  artistProfiles: IArtistProfileReader & IArtistProfileWriter;
};

export type CapabilityDeps = {
  resolveActor(subId: string): Promise<Result<Actor, ResolveActorError>>;

  buildPublicReadCapabilities(): PublicReadCapabilities;

  buildReadCapabilities(actor: Actor): ReadCapabilities;

  runWithWriteCapabilities<T, E>(
    actor: Actor,
    work: (caps: WriteCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;
};
