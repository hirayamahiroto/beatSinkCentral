import type { User } from "../../domain/users/entities";
import type { Artist } from "../../domain/artists/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
  IProfileImageStorage,
} from "../../domain/artistProfiles/repositories";
import type { IUserReader, IUserWriter } from "../../domain/users/repositories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../domain/artists/repositories";
import type { IArtistHandleHistoryWriter } from "../../domain/artistHandleHistories/repositories";
import type {
  IOfferReader,
  IOfferWriter,
} from "../../domain/offers/repositories";
import type { ILinkTypeReader } from "../../domain/linkTypes/repositories";
import type { IAnalyticsEventWriter } from "../../domain/analyticsEvents/repositories";
import type { IStoryQuestionReader } from "../../domain/storyQuestions/repositories";
import type { IPresentationPatternReader } from "../../domain/presentationPatterns/repositories";
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

export type ResolveUserError = UserNotFoundError;

export type IdentityCapabilities = {
  actorResolution: ActorResolution;
};

export type PublicReadCapabilities = {
  artistProfiles: IArtistProfileReader;
  linkTypes: ILinkTypeReader;
  storyQuestions: IStoryQuestionReader;
  presentationPatterns: IPresentationPatternReader;
};

export type ArtistReadCapabilities = {
  actor: Actor;
  artistProfiles: IArtistProfileReader;
  offers: IOfferReader;
};

export type PublicWriteCapabilities = {
  analyticsEvents: IAnalyticsEventWriter;
};

export type UserWriteCapabilities = {
  user: User;
  users: IUserReader & IUserWriter;
};

export type ArtistWriteCapabilities = {
  actor: Actor;
  users: IUserReader & IUserWriter;
  artists: IArtistReader & IArtistWriter;
  artistHandleHistories: IArtistHandleHistoryWriter;
  artistProfiles: IArtistProfileReader & IArtistProfileWriter;
  offers: IOfferReader & IOfferWriter;
};

export type RegistrationCapabilities = {
  users: IUserReader & IUserWriter;
  artists: IArtistReader & IArtistWriter;
};

export type ArtistStorageWriteCapabilities = {
  actor: Actor;
  profileImages: IProfileImageStorage;
};

export type CapabilityDeps = {
  resolveActorState(subId: string): Promise<ActorResolution>;

  buildPublicReadCapabilities(): PublicReadCapabilities;

  buildPublicWriteCapabilities(): PublicWriteCapabilities;

  buildArtistReadCapabilities(actor: Actor): ArtistReadCapabilities;

  buildArtistStorageWriteCapabilities(
    actor: Actor,
  ): ArtistStorageWriteCapabilities;

  runWithUserWriteCapabilities<T, E>(
    user: User,
    work: (caps: UserWriteCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;

  runWithArtistWriteCapabilities<T, E>(
    actor: Actor,
    work: (caps: ArtistWriteCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;

  runWithRegistrationCapabilities<T, E>(
    work: (caps: RegistrationCapabilities) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>>;
};
