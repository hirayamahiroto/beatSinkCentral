import type { User } from "../../domain/users/entities";
import type { Artist } from "../../domain/artists/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../domain/artistProfiles/repositories";
import type { IUserReader, IUserWriter } from "../../domain/users/repositories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../domain/artists/repositories";
import type { ILinkTypeReader } from "../../domain/linkTypes/repositories";
import type { UserNotFoundError } from "../../domain/users/errors/userNotFound";
import type { ArtistNotFoundError } from "../../domain/artists/errors/artistNotFound";
import type { Result } from "../../utils/result";

export type Actor = {
  readonly user: User;
  readonly artist: Artist;
};

export type ActorResolution =
  | { status: "unregistered" }
  | { status: "userOnly"; user: User }
  | { status: "complete"; actor: Actor };

export type ResolveActorError = UserNotFoundError | ArtistNotFoundError;

export type IdentityCapabilities = {
  actorResolution: ActorResolution;
};

export type PublicReadCapabilities = {
  artistProfiles: IArtistProfileReader;
  linkTypes: ILinkTypeReader;
};

export type ReadCapabilities = {
  actor: Actor;
  artistProfiles: IArtistProfileReader;
};

export type WriteCapabilities = {
  actor: Actor;
  users: IUserReader & IUserWriter;
  artists: IArtistReader & IArtistWriter;
  artistProfiles: IArtistProfileReader & IArtistProfileWriter;
};

export type RegistrationCapabilities = {
  users: IUserReader & IUserWriter;
  artists: IArtistReader & IArtistWriter;
};

export type CapabilityDeps = {
  resolveActorState(subId: string): Promise<ActorResolution>;

  buildPublicReadCapabilities(): PublicReadCapabilities;

  buildReadCapabilities(actor: Actor): ReadCapabilities;

  runWithWriteCapabilities<T, E>(
    actor: Actor,
    work: (caps: WriteCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;

  runWithRegistrationCapabilities<T, E>(
    work: (caps: RegistrationCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;
};
